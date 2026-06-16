const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load env
dotenv.config();

const User = require('./models/User');
const Group = require('./models/Group');
const Expense = require('./models/Expense');
const Settlement = require('./models/Settlement');
const Notification = require('./models/Notification');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/split-bill';

async function runTests() {
  console.log('Connecting to database...');
  await mongoose.connect(MONGO_URI);
  console.log('Connected.');

  // Clear previous test database data
  console.log('Cleaning up collections...');
  await User.deleteMany({ email: { $in: ['alice@test.com', 'bob@test.com', 'charlie@test.com'] } });
  await Group.deleteMany({ name: 'E2E Test Group' });
  
  const testGroup = await Group.findOne({ name: 'E2E Test Group' });
  if (testGroup) {
    await Expense.deleteMany({ group: testGroup._id });
    await Settlement.deleteMany({ group: testGroup._id });
    await Notification.deleteMany({ group: testGroup._id });
    await Group.deleteOne({ _id: testGroup._id });
  }
  console.log('Cleaned.');

  // 1. Create Users
  console.log('\n--- 1. Creating Users ---');
  const alice = await User.create({ name: 'Alice', email: 'alice@test.com', password: 'password123', useCase: 'Friends' });
  const bob = await User.create({ name: 'Bob', email: 'bob@test.com', password: 'password123', useCase: 'Friends' });
  const charlie = await User.create({ name: 'Charlie', email: 'charlie@test.com', password: 'password123', useCase: 'Friends' });
  console.log(`Created Alice (${alice._id}), Bob (${bob._id}), Charlie (${charlie._id})`);

  // 2. Create Group
  console.log('\n--- 2. Creating Group ---');
  const group = await Group.create({
    name: 'E2E Test Group',
    type: 'Friends',
    code: 'TSTGRP',
    admin: alice._id,
    members: [alice._id, bob._id, charlie._id]
  });
  console.log(`Created Group "${group.name}" with code ${group.code}`);

  // Link group to users
  await User.updateMany(
    { _id: { $in: [alice._id, bob._id, charlie._id] } },
    { $push: { groups: group._id } }
  );

  // 3. Log Expense 1: ₹3000 paid by Alice, split equally
  console.log('\n--- 3. Logging Expense 1 (₹3000 paid by Alice, split equally) ---');
  const splitAmount = 3000 / 3;
  const exp1 = await Expense.create({
    group: group._id,
    amount: 3000,
    category: 'Grocery',
    paidBy: alice._id,
    splitBetween: [
      { user: alice._id, amount: splitAmount },
      { user: bob._id, amount: splitAmount },
      { user: charlie._id, amount: splitAmount }
    ]
  });
  console.log(`Expense 1 logged. ID: ${exp1._id}`);

  // 4. Log Expense 2: ₹1500 paid by Bob, custom split (Alice owes ₹1000, Charlie owes ₹500)
  console.log('\n--- 4. Logging Expense 2 (₹1500 paid by Bob, custom split) ---');
  const exp2 = await Expense.create({
    group: group._id,
    amount: 1500,
    category: 'Electricity',
    paidBy: bob._id,
    splitBetween: [
      { user: alice._id, amount: 1000 },
      { user: bob._id, amount: 0 },
      { user: charlie._id, amount: 500 }
    ]
  });
  console.log(`Expense 2 logged. ID: ${exp2._id}`);

  // 5. Verify Balances before Netting
  console.log('\n--- 5. Simulating Dashboard Netting Calculations ---');
  const expenses = await Expense.find({ group: group._id });
  const settlements = await Settlement.find({ group: group._id, status: 'completed' });

  // Compute debts matrix
  const debts = {};
  const memberIds = [alice._id.toString(), bob._id.toString(), charlie._id.toString()];
  memberIds.forEach(u1 => {
    debts[u1] = {};
    memberIds.forEach(u2 => {
      debts[u1][u2] = 0;
    });
  });

  expenses.forEach(exp => {
    const payerId = exp.paidBy.toString();
    exp.splitBetween.forEach(split => {
      const debtorId = split.user.toString();
      if (debtorId !== payerId) {
        debts[debtorId][payerId] += split.amount;
      }
    });
  });

  settlements.forEach(sett => {
    const fromId = sett.fromUser.toString();
    const toId = sett.toUser.toString();
    debts[fromId][toId] -= sett.amount;
  });

  console.log('Raw Debts Sheet:');
  console.log('Alice owes Bob:', debts[alice._id.toString()][bob._id.toString()]);
  console.log('Bob owes Alice:', debts[bob._id.toString()][alice._id.toString()]);
  console.log('Charlie owes Alice:', debts[charlie._id.toString()][alice._id.toString()]);
  console.log('Charlie owes Bob:', debts[charlie._id.toString()][bob._id.toString()]);

  // Compute Net Pairwise Debts
  const netDebts = {};
  memberIds.forEach(u1 => netDebts[u1] = {});

  for (let i = 0; i < memberIds.length; i++) {
    const u1 = memberIds[i];
    for (let j = i + 1; j < memberIds.length; j++) {
      const u2 = memberIds[j];
      const u1OwesU2 = debts[u1][u2] || 0;
      const u2OwesU1 = debts[u2][u1] || 0;

      if (u1OwesU2 > u2OwesU1) {
        netDebts[u1][u2] = u1OwesU2 - u2OwesU1;
        netDebts[u2][u1] = 0;
      } else if (u2OwesU1 > u1OwesU2) {
        netDebts[u2][u1] = u2OwesU1 - u1OwesU2;
        netDebts[u1][u2] = 0;
      } else {
        netDebts[u1][u2] = 0;
        netDebts[u2][u1] = 0;
      }
    }
  }

  console.log('\nNetted Debts Sheet:');
  console.log('Alice owes Bob (Netted):', netDebts[alice._id.toString()][bob._id.toString()] || 0);
  console.log('Bob owes Alice (Netted):', netDebts[bob._id.toString()][alice._id.toString()] || 0);
  console.log('Charlie owes Alice (Netted):', netDebts[charlie._id.toString()][alice._id.toString()] || 0);
  console.log('Charlie owes Bob (Netted):', netDebts[charlie._id.toString()][bob._id.toString()] || 0);

  // Assertions
  // Alice owes Bob 1000, Bob owes Alice 1000. Netted: 0
  const aliceBobNet = netDebts[alice._id.toString()][bob._id.toString()] || 0;
  const bobAliceNet = netDebts[bob._id.toString()][alice._id.toString()] || 0;
  if (aliceBobNet !== 0 || bobAliceNet !== 0) {
    throw new Error('E2E Netting Assertion failed: Alice and Bob debts should cancel out.');
  }
  
  // Charlie owes Alice 1000, Charlie owes Bob 500 + 1000 = 1500? Wait,
  // Let's trace Charlie:
  // Expense 1: Charlie owes Alice ₹1000 (Alice paid ₹3000, split 3 ways).
  // Expense 2: Charlie owes Bob ₹500 (Bob paid ₹1500, custom split: Alice ₹1000, Charlie ₹500, Bob ₹0).
  // Thus Charlie owes Alice ₹1000, and Charlie owes Bob ₹1500 (wait: in Expense 1 Charlie owes Bob nothing, Bob owes Alice ₹1000. In Expense 2, Charlie owes Bob ₹500).
  // Yes! Charlie owes Alice ₹1000, Charlie owes Bob ₹1500 (since Bob owes Alice ₹1000, Charlie owes Alice ₹1000, Charlie owes Bob ₹500 - wait. Let's recalculate:
  // Expense 1 (payer Alice, split equal): Bob owes Alice 1000, Charlie owes Alice 1000.
  // Expense 2 (payer Bob, split custom: Alice 1000, Charlie 500, Bob 0): Alice owes Bob 1000, Charlie owes Bob 500.
  // Netting Alice and Bob: Bob owes Alice 1000, Alice owes Bob 1000 -> Netted: 0.
  // Netting Charlie and Alice: Charlie owes Alice 1000, Alice owes Charlie 0 -> Netted: Charlie owes Alice 1000.
  // Netting Charlie and Bob: Charlie owes Bob 500, Bob owes Charlie 0 -> Netted: Charlie owes Bob 500.
  // This is correct! Let's check:
  const charlieAliceNet = netDebts[charlie._id.toString()][alice._id.toString()] || 0;
  const charlieBobNet = netDebts[charlie._id.toString()][bob._id.toString()] || 0;
  
  if (charlieAliceNet !== 1000 || charlieBobNet !== 500) {
    throw new Error(`E2E Netting Assertion failed. Charlie owes Alice: ${charlieAliceNet} (expected 1000), Charlie owes Bob: ${charlieBobNet} (expected 500)`);
  }
  console.log('✅ Balance netting calculations are correct!');

  // 6. Log Settlement: Charlie paid Alice ₹1000
  console.log('\n--- 6. Logging Settlement (Charlie paid Alice ₹1000) ---');
  const settlement = await Settlement.create({
    group: group._id,
    fromUser: charlie._id,
    toUser: alice._id,
    amount: 1000,
    status: 'completed' // auto-complete for test check
  });
  console.log(`Settlement logged. ID: ${settlement._id}, status: ${settlement.status}`);

  // 7. Verify balances after settlement
  console.log('\n--- 7. Recalculating Balances after Settlement ---');
  const updatedSettlements = await Settlement.find({ group: group._id, status: 'completed' });
  
  // Reset debts sheet
  memberIds.forEach(u1 => {
    memberIds.forEach(u2 => {
      debts[u1][u2] = 0;
    });
  });

  expenses.forEach(exp => {
    const payerId = exp.paidBy.toString();
    exp.splitBetween.forEach(split => {
      const debtorId = split.user.toString();
      if (debtorId !== payerId) {
        debts[debtorId][payerId] += split.amount;
      }
    });
  });

  updatedSettlements.forEach(sett => {
    const fromId = sett.fromUser.toString();
    const toId = sett.toUser.toString();
    debts[fromId][toId] -= sett.amount;
  });

  // Re-net
  memberIds.forEach(u1 => netDebts[u1] = {});
  for (let i = 0; i < memberIds.length; i++) {
    const u1 = memberIds[i];
    for (let j = i + 1; j < memberIds.length; j++) {
      const u2 = memberIds[j];
      const u1OwesU2 = debts[u1][u2] || 0;
      const u2OwesU1 = debts[u2][u1] || 0;

      if (u1OwesU2 > u2OwesU1) {
        netDebts[u1][u2] = u1OwesU2 - u2OwesU1;
        netDebts[u2][u1] = 0;
      } else if (u2OwesU1 > u1OwesU2) {
        netDebts[u2][u1] = u2OwesU1 - u1OwesU2;
        netDebts[u1][u2] = 0;
      } else {
        netDebts[u1][u2] = 0;
        netDebts[u2][u1] = 0;
      }
    }
  }

  const charlieAlicePost = netDebts[charlie._id.toString()][alice._id.toString()] || 0;
  console.log('Charlie owes Alice after settlement:', charlieAlicePost);
  if (charlieAlicePost !== 0) {
    throw new Error(`Assertion failed: Charlie owes Alice ${charlieAlicePost} (expected 0)`);
  }
  console.log('✅ Post-settlement calculations are correct!');

  console.log('\nCleaning up database...');
  await User.deleteMany({ email: { $in: ['alice@test.com', 'bob@test.com', 'charlie@test.com'] } });
  await Group.deleteMany({ name: 'E2E Test Group' });
  await Expense.deleteMany({ group: group._id });
  await Settlement.deleteMany({ group: group._id });
  await Notification.deleteMany({ group: group._id });
  console.log('Cleanup complete.');

  console.log('\n🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY!');
  process.exit(0);
}

runTests().catch(err => {
  console.error('\n❌ TEST FAILED WITH ERROR:', err);
  process.exit(1);
});
