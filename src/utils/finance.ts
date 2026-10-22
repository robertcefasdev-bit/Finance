import type {
  Advance,
  AdvanceItem,
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
    .reduce((sum, d) => sum + d.amount * Math.max(d.total - paidCount(d), 0), 0);
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

// Quantas parcelas da dívida já foram pagas
export function paidCount(debt: Debt) {
  return debt.paidInstallments ?? debt.current - 1;
}

// Parcela "bruta" do mês de ref, sem limitar ao início/fim da dívida
function rawInstallment(debt: Debt, ref: Date) {
  const now = new Date();
  const [y, m] = (debt.startMonth ?? `${now.getFullYear()}-${now.getMonth() + 1}`)
    .split("-")
    .map(Number);
  return debt.current + (ref.getFullYear() - y) * 12 + (ref.getMonth() + 1 - m);
}

// Parcelas já vencidas até o mês de ref e ainda não pagas
export function dueInstallments(debt: Debt, ref: Date) {
  if (debt.paid) return 0;
  return Math.max(0, Math.min(rawInstallment(debt, ref), debt.total) - paidCount(debt));
}

// O que aparece na Projeção naquele mês (null = nada a receber)
export function projectedInstallment(
  debt: Debt,
  ref: Date,
  isFirstMonth: boolean,
): { current: number; amount: number } | null {
  if (debt.paid) return null;
  const paid = paidCount(debt);
  if (isFirstMonth) {
    // no mês atual entram também as parcelas atrasadas
    const due = dueInstallments(debt, ref);
    if (due <= 0) return null;
    return {
      current: Math.min(rawInstallment(debt, ref), debt.total),
      amount: Math.round(debt.amount * due * 100) / 100,
    };
  }
  const n = installmentNumber(debt, ref);
  return n !== null && n > paid ? { current: n, amount: debt.amount } : null;
}

export function getCurrentMonthOwed(debts: Debt[]) {
  const now = new Date();
  const total = debts.reduce(
    (sum, debt) => sum + debt.amount * dueInstallments(debt, now),
    0,
  );
  return Math.round(total * 100) / 100;
}

// Cor gradual do salário comprometido: verde → amarelo → laranja → vermelho
export function commitColor(pct: number) {
  const stops: [number, [number, number, number]][] = [
    [30, [34, 197, 94]],
    [50, [234, 179, 8]],
    [70, [249, 115, 22]],
    [90, [239, 68, 68]],
  ];
  if (pct <= stops[0][0]) return `rgb(${stops[0][1].join(",")})`;
  for (let i = 1; i < stops.length; i++) {
    const [p1, c1] = stops[i];
    const [p0, c0] = stops[i - 1];
    if (pct <= p1) {
      const t = (pct - p0) / (p1 - p0);
      return `rgb(${c0.map((v, k) => Math.round(v + (c1[k] - v) * t)).join(",")})`;
    }
  }
  return `rgb(${stops[stops.length - 1][1].join(",")})`;
}

export function commitLabel(pct: number) {
  if (pct < 40) return "Tranquilo";
  if (pct < 60) return "Atenção";
  if (pct < 80) return "Alto";
  return "Crítico";
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

// ---------- Adiantamento e extrato ----------
const cents = (n: number) => Math.round(n * 100);
const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// Índice absoluto do mês em que vence a parcela k da dívida
function monthIndexOf(debt: Debt, k: number) {
  const now = new Date();
  const [y, m] = (debt.startMonth ?? `${now.getFullYear()}-${now.getMonth() + 1}`)
    .split("-")
    .map(Number);
  return y * 12 + (m - 1) + (k - debt.current);
}

export function installmentMonthLabel(debt: Debt, k: number) {
  const idx = monthIndexOf(debt, k);
  return `${MONTHS[((idx % 12) + 12) % 12]}/${Math.floor(idx / 12)}`;
}

// Parcelas já vencidas (até o mês de ref) e ainda não pagas
export function openInstallments(debt: Debt, ref: Date): number[] {
  if (debt.paid) return [];
  const last = Math.min(rawInstallment(debt, ref), debt.total);
  const list: number[] = [];
  for (let k = paidCount(debt) + 1; k <= last; k++) list.push(k);
  return list;
}

// Distribui o valor (mais o saldo a favor) pelas parcelas em aberto,
// da mais antiga para a mais nova. Parcela que não cabe é pulada (e as
// seguintes da mesma dívida esperam, porque são pagas em ordem).
export function planAdvance(friend: Friend, amount: number, ref: Date = new Date()) {
  const creditBefore = friend.credit ?? 0;
  let pool = amount > 0 ? cents(amount) + cents(creditBefore) : cents(creditBefore);
  const queue: { debt: Debt; k: number; order: number }[] = [];
  friend.debts.forEach((debt, i) => {
    for (const k of openInstallments(debt, ref)) {
      queue.push({ debt, k, order: monthIndexOf(debt, k) * 1000 + i });
    }
  });
  queue.sort((a, b) => a.order - b.order);

  const blocked = new Set<string>();
  const applied = new Map<string, AdvanceItem>();
  let usedCents = 0;
  if (amount > 0) {
    for (const { debt, k } of queue) {
      if (blocked.has(debt.id)) continue;
      const c = cents(debt.amount);
      if (c > pool) {
        blocked.add(debt.id);
        continue;
      }
      pool -= c;
      usedCents += c;
      const item = applied.get(debt.id) ?? {
        debtId: debt.id,
        title: debt.title,
        installments: [],
        amount: 0,
      };
      item.installments.push(k);
      item.amount = (cents(item.amount) + c) / 100;
      applied.set(debt.id, item);
    }
  }
  return {
    applied: [...applied.values()],
    used: usedCents / 100,
    creditBefore,
    creditAfter: amount > 0 ? pool / 100 : creditBefore,
    hasOpen: queue.length > 0,
  };
}

const dm = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

// Texto do extrato (para WhatsApp ou copiar)
export function buildStatement(friend: Friend, pix: string, ref: Date = new Date()) {
  const lines: string[] = [`Oi ${friend.name}! Segue o extrato das suas dívidas 📋`, ""];
  const open: string[] = [];
  for (const debt of friend.debts) {
    for (const k of openInstallments(debt, ref)) {
      const part = debt.total > 1 ? ` — parcela ${k}/${debt.total}` : "";
      open.push(`• ${debt.title}${part} (${installmentMonthLabel(debt, k)}): ${brl(debt.amount)}`);
    }
  }
  if (open.length === 0) {
    lines.push("Nenhuma dívida em aberto neste mês ✅");
  } else {
    lines.push("Em aberto:", ...open);
  }
  lines.push("", `Total em aberto: ${brl(getCurrentMonthOwed(friend.debts))}`);
  const owedAll = friendOwed(friend, ref);
  if (owedAll.future.length > 0) {
    lines.push("", "Próximas faturas:");
    owedAll.future.forEach((item) => lines.push(`• ${ymLabel(item.ym)}: ${brl(item.amount)}`));
    lines.push("", `Total geral a pagar: ${brl(owedAll.total)}`);
  }

  const ym = `${ref.getFullYear()}-${String(ref.getMonth() + 1).padStart(2, "0")}`;
  const advances = (friend.advances ?? []).filter((a) => a.date.slice(0, 7) === ym);
  if (advances.length > 0) {
    lines.push("", "Adiantamentos recebidos neste mês 💰");
    for (const a of advances) {
      const paid = a.applied
        .map((i) => {
          const debt = friend.debts.find((d) => d.id === i.debtId);
          const parts = debt && debt.total > 1 ? ` (${i.installments.join(", ")}/${debt.total})` : "";
          return `${i.title}${parts}`;
        })
        .join("; ");
      lines.push(`• ${dm(a.date)}: ${brl(a.amount)}${paid ? ` → quitou: ${paid}` : ""}`);
    }
  }
  if ((friend.credit ?? 0) > 0) lines.push("", `Saldo a favor: ${brl(friend.credit ?? 0)}`);
  if (pix) lines.push("", `Minha chave Pix: ${pix}`);
  return lines.join("\n");
}

export type { Advance };

// ---------- Fatura do cartão ----------
const pad = (n: number) => String(n).padStart(2, "0");

// Data de hoje no fuso do aparelho ("AAAA-MM-DD")
export function localToday() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export const currentYM = () => localToday().slice(0, 7);

// Mês da fatura em que a compra entra: depois do dia de fechamento, vai para o mês seguinte
export function invoiceMonth(dateIso: string, card?: Card | null) {
  const [y, m, d] = (dateIso || localToday()).split("-").map(Number);
  let idx = y * 12 + (m - 1);
  if (card && card.id !== "cash" && d > card.closing) idx += 1;
  return `${Math.floor(idx / 12)}-${pad((idx % 12) + 1)}`;
}

export function ymLabel(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  return `${MONTHS[m - 1]}/${y}`;
}

// Texto explicativo: em qual fatura a compra vai cair
export function invoiceNote(dateIso: string, card?: Card | null) {
  if (!card || card.id === "cash") return null;
  const inv = invoiceMonth(dateIso, card);
  const purchase = (dateIso || localToday()).slice(0, 7);
  return inv === purchase
    ? `📅 Entra na fatura de ${ymLabel(inv)} (o cartão fecha dia ${card.closing}).`
    : `📅 O cartão fechou dia ${card.closing}: esta compra entra na fatura de ${ymLabel(inv)}.`;
}

// Mês em que a despesa começa a valer
export const expenseStart = (e: Expense) => e.startMonth ?? e.date.slice(0, 7);

// Em que parcela da despesa está o mês de ref (diff < 0 = ainda não começou)
export function expenseMonthInfo(e: Expense, ref: Date) {
  const [y, m] = expenseStart(e).split("-").map(Number);
  const diff = (ref.getFullYear() - y) * 12 + (ref.getMonth() + 1 - m);
  const total = e.installments ?? 1;
  return { diff, total, current: Math.min(Math.max(diff + 1, 1), total) };
}

// ---------- Fatura: o que está registrado em cada mês ----------
const round2 = (n: number) => Math.round(n * 100) / 100;

export function invoiceBreakdown(
  card: Card,
  ym: string,
  expenses: Expense[],
  friends: Friend[],
  fixedExpenses: FixedExpense[],
) {
  const [y, m] = ym.split("-").map(Number);
  const ref = new Date(y, m - 1, 1);
  // despesas pagas também contam: a fatura do banco inclui tudo que foi cobrado
  const mine = expenses
    .filter((e) => e.cardId === card.id)
    .reduce((sum, e) => {
      const info = expenseMonthInfo(e, ref);
      return info.diff >= 0 && info.diff < info.total ? sum + monthlyAmount(e) : sum;
    }, 0);
  const fixed = fixedExpenses
    .filter((fe) => fe.active && fe.cardId === card.id)
    .reduce((sum, fe) => sum + fe.amount, 0);
  const debtors = friends
    .map((friend) => ({
      id: friend.id,
      name: friend.name,
      amount: round2(
        friend.debts
          .filter((d) => d.cardId === card.id && installmentNumber(d, ref) !== null)
          .reduce((sum, d) => sum + d.amount, 0),
      ),
    }))
    .filter((d) => d.amount > 0);
  const total = round2(mine + fixed + debtors.reduce((sum, d) => sum + d.amount, 0));
  return { mine: round2(mine), fixed: round2(fixed), debtors, total };
}

// ---------- Risco por mês (só despesas minhas) ----------
const monthOffset = (from: Date, ym: string) => {
  const [y, m] = ym.split("-").map(Number);
  return (y - from.getFullYear()) * 12 + (m - 1 - from.getMonth());
};

// Valor das minhas despesas em aberto que caem no mês de ref
export function ownMonthAmount(expenses: Expense[], ref: Date) {
  return round2(
    expenses
      .filter((e) => !e.paid)
      .reduce((sum, e) => {
        const info = expenseMonthInfo(e, ref);
        return info.diff >= 0 && info.diff < info.total ? sum + monthlyAmount(e) : sum;
      }, 0),
  );
}

// Quantos meses à frente ainda tenho despesa minha em aberto (0 = só neste mês)
export function lastOwnMonthOffset(expenses: Expense[]) {
  const now = new Date();
  return expenses
    .filter((e) => !e.paid)
    .reduce(
      (max, e) => Math.max(max, monthOffset(now, expenseStart(e)) + (e.installments ?? 1) - 1),
      0,
    );
}

// ---------- Ciclo do cartão: fatura aberta (fecha em N dias) ou fechada (vence em N dias) ----------
function clampDay(year: number, month: number, day: number) {
  const last = new Date(year, month + 1, 0).getDate();
  return new Date(year, month, Math.min(day, last));
}

export function cardCycle(card: Card, now: Date = new Date()) {
  const t = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const DAY = 86400000;
  // último fechamento que já passou (no dia do fechamento a fatura ainda está aberta)
  let closeDate = clampDay(t.getFullYear(), t.getMonth(), card.closing);
  if (!(closeDate < t)) closeDate = clampDay(t.getFullYear(), t.getMonth() - 1, card.closing);
  // vencimento dessa fatura (se o dia de vencer é antes do de fechar, vence no mês seguinte)
  let dueDate = clampDay(closeDate.getFullYear(), closeDate.getMonth(), card.due);
  if (dueDate <= closeDate) dueDate = clampDay(closeDate.getFullYear(), closeDate.getMonth() + 1, card.due);
  if (t <= dueDate) {
    return { phase: "closed" as const, days: Math.round((dueDate.getTime() - t.getTime()) / DAY) };
  }
  let next = clampDay(t.getFullYear(), t.getMonth(), card.closing);
  if (next < t) next = clampDay(t.getFullYear(), t.getMonth() + 1, card.closing);
  return { phase: "open" as const, days: Math.round((next.getTime() - t.getTime()) / DAY) };
}

export function cardCycleText(card: Card, now: Date = new Date()) {
  const { phase, days } = cardCycle(card, now);
  const when = (n: number, verb: string) =>
    n === 0 ? `${verb} hoje!` : n === 1 ? `${verb} amanhã` : `${verb} em ${n} dias`;
  return phase === "closed"
    ? { phase, days, text: `Fechada · ${when(days, "vence")}` }
    : { phase, days, text: when(days, "Fecha") };
}

// ---------- Campo de valor: a vírgula já vem no lugar ----------
// Quem digita só coloca números: 1 → 0,01 · 123 → 1,23 · 12345 → 123,45
export function maskMoney(raw: string) {
  let digits = raw.replace(/\D/g, "").replace(/^0+/, "").slice(0, 12);
  if (!digits) return "";
  while (digits.length < 3) digits = `0${digits}`;
  return `${digits.slice(0, -2)},${digits.slice(-2)}`;
}

// Número -> texto do campo (300 → "300,00")
export const moneyStr = (n: number) => n.toFixed(2).replace(".", ",");

// Texto do campo -> número ("1234,56" → 1234.56)
export const parseMoney = (s: string) => parseFloat(s.replace(",", ".")) || 0;

// ---------- Devedor: o que vence agora e o que vem nas próximas faturas ----------
export function friendOwed(friend: Friend, now: Date = new Date()) {
  const cur = `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
  const byMonth = new Map<string, number>();
  for (const debt of friend.debts) {
    if (debt.paid) continue;
    for (let k = paidCount(debt) + 1; k <= debt.total; k++) {
      const idx = monthIndexOf(debt, k);
      const ym = `${Math.floor(idx / 12)}-${pad((idx % 12) + 1)}`;
      byMonth.set(ym, (byMonth.get(ym) ?? 0) + debt.amount);
    }
  }
  let dueNow = 0;
  const future: { ym: string; amount: number }[] = [];
  [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([ym, amount]) => {
      if (ym <= cur) dueNow += amount;
      else future.push({ ym, amount: round2(amount) });
    });
  dueNow = round2(dueNow);
  const total = round2(dueNow + future.reduce((sum, item) => sum + item.amount, 0));
  return { dueNow, total, future, next: future[0] ?? null };
}

// O valor que aparece em destaque: o do mês atual ou, se não houver, o da próxima fatura
export function friendHeadline(friend: Friend, now: Date = new Date()) {
  const owed = friendOwed(friend, now);
  if (owed.dueNow > 0) return { amount: owed.dueNow, ym: null as string | null, owed };
  if (owed.next) return { amount: owed.next.amount, ym: owed.next.ym as string | null, owed };
  return { amount: 0, ym: null as string | null, owed };
}
