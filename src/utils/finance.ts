import type {
  Card,
  Debt,
  Expense,
  FixedExpense,
  Friend,
} from "../data/mockData";

export function getCurrentMonthOwed(debts: Debt[]) {
  return debts
    .filter((debt) => !debt.paid)
    .reduce((sum, debt) => sum + debt.amount, 0);
}

export function syncFriend(friend: Friend): Friend {
  const totalOwed = getCurrentMonthOwed(friend.debts);

  return {
    ...friend,
    totalOwed,
    status: totalOwed > 0 ? "pending" : "paid",
  };
}

export function buildProjectionData({
  salary,
  fixedExpenses,
  cards,
  friends,
  expenses,
}: {
  salary: number;
  fixedExpenses: FixedExpense[];
  cards: Card[];
  friends: Friend[];
  expenses: Expense[];
}) {
  const activeFixed = fixedExpenses.filter((item) => item.active);
  const totalFixed = activeFixed.reduce((sum, item) => sum + item.amount, 0);
  const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);
  const committed = totalFixed + totalExpenses;
  const remainingSalary = salary - committed;

  const months = [
    "Jan 2027",
    "Fev 2027",
    "Mar 2027",
    "Abr 2027",
    "Mai 2027",
    "Jun 2027",
    "Jul 2027",
    "Ago 2027",
    "Set 2027",
    "Out 2027",
    "Nov 2027",
    "Dez 2027",
  ];

  const installments = friends.flatMap((friend) =>
    friend.debts
      .filter((debt) => !debt.paid)
      .map((debt) => ({
        ...debt,
        personName: friend.name,
        personInitials: friend.initials,
        personColor: friend.color,
        isOwner: false,
      })),
  );

  const projection = months.map((month, index) => {
    const monthExpenses = totalExpenses + totalFixed;
    const monthBalanace = salary - monthExpenses;
    return {
      month,
      expenses: monthExpenses,
      balance: monthBalanace,
      installments: installments.map((item) => ({
        ...item,
        current: Math.min(item.current + index, item.total),
      })),
    };
  });

  return {
    salary,
    totalFixed,
    committed,
    remainingSalary,
    months,
    projection,
    installments,
  };
}
