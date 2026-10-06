import type {
  Card,
  Debt,
  Expense,
  FixedExpense,
  Friend,
} from "../data/mockData";

// Valor da parcela do mês de uma despesa minha (valor total ÷ parcelas)
export function monthlyAmount(expense: Expense) {
  return (
    Math.round((expense.amount / (expense.installments || 1)) * 100) / 100
  );
}

// Quanto do limite do cartão já está comprometido:
// minhas despesas não pagas (valor total), dívidas dos devedores (parcelas que faltam)
// e despesas fixas ativas lançadas no cartão (1 mês).
export function cardUsed(
  cardId: string,
  expenses: Expense[],
  friends: Friend[],
  fixedExpenses: FixedExpense[],
) {
  const mine = expenses
    .filter((e) => e.cardId === cardId && !e.paid)
    .reduce((sum, e) => sum + e.amount, 0);
  const debtors = friends
    .flatMap((f) => f.debts)
    .filter((d) => d.cardId === cardId && !d.paid)
    .reduce((sum, d) => sum + d.amount * Math.max(d.total - d.current + 1, 1), 0);
  const fixed = fixedExpenses
    .filter((fe) => fe.active && fe.cardId === cardId)
    .reduce((sum, fe) => sum + fe.amount, 0);
  return Math.round((mine + debtors + fixed) * 100) / 100;
}

// Número da parcela da dívida no mês de "ref" (null = não há parcela nesse mês)
export function installmentNumber(debt: Debt, ref: Date): number | null {
  const now = new Date();
  const [y, m] = (
    debt.startMonth ?? `${now.getFullYear()}-${now.getMonth() + 1}`
  )
    .split("-")
    .map(Number);
  const diff = (ref.getFullYear() - y) * 12 + (ref.getMonth() + 1 - m);
  const n = debt.current + diff;
  return n >= debt.current && n <= debt.total ? n : null;
}

export function getCurrentMonthOwed(debts: Debt[]) {
  const now = new Date();
  return debts
    .filter((debt) => !debt.paid && installmentNumber(debt, now) !== null)
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
