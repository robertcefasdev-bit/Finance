export type Screen =
  | "home"
  | "future"
  | "addExpense"
  | "debtors"
  | "debtorProfile"
  | "settings"
  | "addCard";

export interface Card {
  id: string;
  name: string;
  bank: string;
  limit: number;
  closing: number;
  due: number;
  color: string;
}

export interface Friend {
  id: string;
  name: string;
  initials: string;
  color: string;
  phone: string;
  pix?: string;
  totalOwed: number;
  status: "pending" | "paid";
  debts: Debt[];
}

export interface Debt {
  id: string;
  title: string;
  category: string;
  cardId: string;
  amount: number;
  current: number;
  total: number;
  paid: boolean;
  paidMonth?: string;
  startMonth?: string; // "AAAA-MM" da 1ª parcela
}

export interface Expense {
  id: string;
  title: string;
  category: string;
  categoryIcon: string;
  cardId: string;
  amount: number;
  date: string;
  paid?: boolean;
  installments?: number;
}

export interface FixedExpense {
  id: string;
  name: string;
  amount: number;
  active: boolean;
  cardId?: string;
}

export const INITIAL_FIXED_EXPENSES: FixedExpense[] = [];

export const INITIAL_SALARY = 0;

export const CARDS: Card[] = [
  {
    id: "nubank",
    name: "Roxinho",
    bank: "Nubank",
    limit: 12000,
    closing: 15,
    due: 22,
    color: "#a855f7",
  },
  {
    id: "itau",
    name: "Personnalité",
    bank: "Itaú",
    limit: 8000,
    closing: 10,
    due: 17,
    color: "#f97316",
  },
  {
    id: "xp",
    name: "Investidor",
    bank: "XP Cartão",
    limit: 15000,
    closing: 5,
    due: 12,
    color: "#3b82f6",
  },
];

export const FRIENDS: Friend[] = [
  {
    id: "ana",
    name: "Ana Lima",
    initials: "AL",
    color: "#a855f7",
    phone: "+55 11 99999-1111",
    totalOwed: 1240.0,
    status: "pending",
    debts: [
      {
        id: "d1",
        title: "Nike Air Max 270",
        category: "Moda",
        cardId: "itau",
        amount: 320.0,
        current: 2,
        total: 5,
        paid: false,
      },
      {
        id: "d2",
        title: "Jantar Fogo de Chão",
        category: "Alimentação",
        cardId: "nubank",
        amount: 180.0,
        current: 1,
        total: 1,
        paid: true,
      },
      {
        id: "d3",
        title: "Show Coldplay",
        category: "Lazer",
        cardId: "xp",
        amount: 740.0,
        current: 1,
        total: 3,
        paid: false,
      },
    ],
  },
  {
    id: "carlos",
    name: "Carlos M.",
    initials: "CM",
    color: "#ec4899",
    phone: "+55 11 98888-2222",
    totalOwed: 2133.34,
    status: "pending",
    debts: [
      {
        id: "d4",
        title: "PlayStation 5",
        category: "Games",
        cardId: "xp",
        amount: 416.67,
        current: 5,
        total: 12,
        paid: false,
      },
      {
        id: "d5",
        title: 'Smart TV 65"',
        category: "Tech",
        cardId: "itau",
        amount: 449.9,
        current: 2,
        total: 10,
        paid: false,
      },
      {
        id: "d6",
        title: "Airpods Pro",
        category: "Tech",
        cardId: "nubank",
        amount: 266.67,
        current: 3,
        total: 6,
        paid: false,
      },
    ],
  },
  {
    id: "juliana",
    name: "Juliana S.",
    initials: "JS",
    color: "#f59e0b",
    phone: "+55 11 97777-3333",
    totalOwed: 533.33,
    status: "pending",
    debts: [
      {
        id: "d7",
        title: "Viagem Rio de Janeiro",
        category: "Viagem",
        cardId: "itau",
        amount: 533.33,
        current: 1,
        total: 6,
        paid: false,
      },
    ],
  },
  {
    id: "pedro",
    name: "Pedro A.",
    initials: "PA",
    color: "#06b6d4",
    phone: "+55 11 96666-4444",
    totalOwed: 1833.32,
    status: "paid",
    debts: [
      {
        id: "d8",
        title: "iPhone 15 Pro",
        category: "Tech",
        cardId: "xp",
        amount: 458.33,
        current: 6,
        total: 18,
        paid: false,
      },
      {
        id: "d9",
        title: "Tênis Adidas",
        category: "Moda",
        cardId: "nubank",
        amount: 174.99,
        current: 2,
        total: 4,
        paid: true,
      },
    ],
  },
];

export const TOP_EXPENSES: Expense[] = [
  {
    id: "e1",
    title: 'MacBook Pro 14"',
    category: "Tech",
    categoryIcon: "💻",
    cardId: "nubank",
    amount: 1299.0,
    date: "2026-08-01",
  },
  {
    id: "e2",
    title: "Plano Academia",
    category: "Saúde",
    categoryIcon: "🏋️",
    cardId: "nubank",
    amount: 159.9,
    date: "2026-08-05",
  },
  {
    id: "e3",
    title: "Mercado Semanal",
    category: "Alimentação",
    categoryIcon: "🛒",
    cardId: "itau",
    amount: 480.0,
    date: "2026-08-04",
  },
  {
    id: "e4",
    title: "Spotify Família",
    category: "Assinatura",
    categoryIcon: "🎵",
    cardId: "nubank",
    amount: 32.9,
    date: "2026-08-01",
  },
  {
    id: "e5",
    title: "Netflix",
    category: "Assinatura",
    categoryIcon: "🎬",
    cardId: "itau",
    amount: 55.9,
    date: "2026-08-03",
  },
];

export const CHART_LINE_DATA = [
  { month: "Mar", salary: 8500, expenses: 5200 },
  { month: "Abr", salary: 8500, expenses: 6100 },
  { month: "Mai", salary: 9000, expenses: 5800 },
  { month: "Jun", salary: 9000, expenses: 7200 },
  { month: "Jul", salary: 9500, expenses: 6400 },
  { month: "Ago", salary: 9500, expenses: 4820 },
];

export const CHART_PIE_DATA = [
  { name: "Tech", value: 1299, color: "#a855f7" },
  { name: "Alimentação", value: 480, color: "#22c55e" },
  { name: "Saúde", value: 160, color: "#3b82f6" },
  { name: "Assinatura", value: 89, color: "#f59e0b" },
  { name: "Lazer", value: 200, color: "#ec4899" },
  { name: "Outros", value: 312, color: "#6b7280" },
];

export const FUTURE_MONTHS = [
  "Set 2026",
  "Out 2026",
  "Nov 2026",
  "Dez 2026",
  "Jan 2027",
];

export interface Installment {
  id: number;
  title: string;
  current: number;
  total: number;
  cardId: string;
  amount: number;
  personName: string;
  personInitials: string;
  personColor: string;
  category: string;
  isOwner: boolean;
}

export const FUTURE_DATA: Record<
  string,
  {
    totalExpenses: number;
    myShare: number;
    toReceive: number;
    installments: Installment[];
  }
> = {
  "Set 2026": {
    totalExpenses: 4820.5,
    myShare: 2940.0,
    toReceive: 1880.5,
    installments: [
      {
        id: 1,
        title: 'MacBook Pro 14"',
        current: 3,
        total: 10,
        cardId: "nubank",
        amount: 1299.0,
        personName: "Eu",
        personInitials: "EU",
        personColor: "#22c55e",
        category: "Tech",
        isOwner: true,
      },
      {
        id: 2,
        title: "Nike Air Max 270",
        current: 2,
        total: 5,
        cardId: "itau",
        amount: 320.0,
        personName: "Ana Lima",
        personInitials: "AL",
        personColor: "#a855f7",
        category: "Moda",
        isOwner: false,
      },
      {
        id: 3,
        title: "PlayStation 5",
        current: 5,
        total: 12,
        cardId: "xp",
        amount: 416.67,
        personName: "Carlos M.",
        personInitials: "CM",
        personColor: "#ec4899",
        category: "Games",
        isOwner: false,
      },
      {
        id: 4,
        title: "Plano Academia",
        current: 9,
        total: 12,
        cardId: "nubank",
        amount: 159.9,
        personName: "Eu",
        personInitials: "EU",
        personColor: "#22c55e",
        category: "Saúde",
        isOwner: true,
      },
      {
        id: 5,
        title: "Viagem Rio",
        current: 1,
        total: 6,
        cardId: "itau",
        amount: 533.33,
        personName: "Juliana S.",
        personInitials: "JS",
        personColor: "#f59e0b",
        category: "Viagem",
        isOwner: false,
      },
      {
        id: 6,
        title: "Spotify Família",
        current: 8,
        total: 12,
        cardId: "nubank",
        amount: 32.9,
        personName: "Eu",
        personInitials: "EU",
        personColor: "#22c55e",
        category: "Assinatura",
        isOwner: true,
      },
      {
        id: 7,
        title: "iPhone 15 Pro",
        current: 6,
        total: 18,
        cardId: "xp",
        amount: 458.33,
        personName: "Pedro A.",
        personInitials: "PA",
        personColor: "#06b6d4",
        category: "Tech",
        isOwner: false,
      },
    ],
  },
  "Out 2026": {
    totalExpenses: 5140.2,
    myShare: 3010.5,
    toReceive: 2129.7,
    installments: [
      {
        id: 1,
        title: 'MacBook Pro 14"',
        current: 4,
        total: 10,
        cardId: "nubank",
        amount: 1299.0,
        personName: "Eu",
        personInitials: "EU",
        personColor: "#22c55e",
        category: "Tech",
        isOwner: true,
      },
      {
        id: 2,
        title: "Nike Air Max 270",
        current: 3,
        total: 5,
        cardId: "itau",
        amount: 320.0,
        personName: "Ana Lima",
        personInitials: "AL",
        personColor: "#a855f7",
        category: "Moda",
        isOwner: false,
      },
      {
        id: 3,
        title: "PlayStation 5",
        current: 6,
        total: 12,
        cardId: "xp",
        amount: 416.67,
        personName: "Carlos M.",
        personInitials: "CM",
        personColor: "#ec4899",
        category: "Games",
        isOwner: false,
      },
      {
        id: 4,
        title: "Plano Academia",
        current: 10,
        total: 12,
        cardId: "nubank",
        amount: 159.9,
        personName: "Eu",
        personInitials: "EU",
        personColor: "#22c55e",
        category: "Saúde",
        isOwner: true,
      },
      {
        id: 5,
        title: "Viagem Rio",
        current: 2,
        total: 6,
        cardId: "itau",
        amount: 533.33,
        personName: "Juliana S.",
        personInitials: "JS",
        personColor: "#f59e0b",
        category: "Viagem",
        isOwner: false,
      },
      {
        id: 7,
        title: "iPhone 15 Pro",
        current: 7,
        total: 18,
        cardId: "xp",
        amount: 458.33,
        personName: "Pedro A.",
        personInitials: "PA",
        personColor: "#06b6d4",
        category: "Tech",
        isOwner: false,
      },
      {
        id: 8,
        title: 'Smart TV 65"',
        current: 2,
        total: 10,
        cardId: "itau",
        amount: 449.9,
        personName: "Carlos M.",
        personInitials: "CM",
        personColor: "#ec4899",
        category: "Tech",
        isOwner: false,
      },
    ],
  },
  "Nov 2026": {
    totalExpenses: 3980.0,
    myShare: 2300.0,
    toReceive: 1680.0,
    installments: [
      {
        id: 1,
        title: 'MacBook Pro 14"',
        current: 5,
        total: 10,
        cardId: "nubank",
        amount: 1299.0,
        personName: "Eu",
        personInitials: "EU",
        personColor: "#22c55e",
        category: "Tech",
        isOwner: true,
      },
      {
        id: 3,
        title: "PlayStation 5",
        current: 7,
        total: 12,
        cardId: "xp",
        amount: 416.67,
        personName: "Carlos M.",
        personInitials: "CM",
        personColor: "#ec4899",
        category: "Games",
        isOwner: false,
      },
      {
        id: 5,
        title: "Viagem Rio",
        current: 3,
        total: 6,
        cardId: "itau",
        amount: 533.33,
        personName: "Juliana S.",
        personInitials: "JS",
        personColor: "#f59e0b",
        category: "Viagem",
        isOwner: false,
      },
      {
        id: 7,
        title: "iPhone 15 Pro",
        current: 8,
        total: 18,
        cardId: "xp",
        amount: 458.33,
        personName: "Pedro A.",
        personInitials: "PA",
        personColor: "#06b6d4",
        category: "Tech",
        isOwner: false,
      },
    ],
  },
  "Dez 2026": {
    totalExpenses: 6200.0,
    myShare: 3750.0,
    toReceive: 2450.0,
    installments: [
      {
        id: 1,
        title: 'MacBook Pro 14"',
        current: 6,
        total: 10,
        cardId: "nubank",
        amount: 1299.0,
        personName: "Eu",
        personInitials: "EU",
        personColor: "#22c55e",
        category: "Tech",
        isOwner: true,
      },
      {
        id: 3,
        title: "PlayStation 5",
        current: 8,
        total: 12,
        cardId: "xp",
        amount: 416.67,
        personName: "Carlos M.",
        personInitials: "CM",
        personColor: "#ec4899",
        category: "Games",
        isOwner: false,
      },
      {
        id: 5,
        title: "Viagem Rio",
        current: 4,
        total: 6,
        cardId: "itau",
        amount: 533.33,
        personName: "Juliana S.",
        personInitials: "JS",
        personColor: "#f59e0b",
        category: "Viagem",
        isOwner: false,
      },
      {
        id: 7,
        title: "iPhone 15 Pro",
        current: 9,
        total: 18,
        cardId: "xp",
        amount: 458.33,
        personName: "Pedro A.",
        personInitials: "PA",
        personColor: "#06b6d4",
        category: "Tech",
        isOwner: false,
      },
      {
        id: 9,
        title: "Ceia de Natal",
        current: 1,
        total: 2,
        cardId: "nubank",
        amount: 890.0,
        personName: "Eu",
        personInitials: "EU",
        personColor: "#22c55e",
        category: "Alimentação",
        isOwner: true,
      },
    ],
  },
  "Jan 2027": {
    totalExpenses: 3200.0,
    myShare: 2100.0,
    toReceive: 1100.0,
    installments: [
      {
        id: 1,
        title: 'MacBook Pro 14"',
        current: 7,
        total: 10,
        cardId: "nubank",
        amount: 1299.0,
        personName: "Eu",
        personInitials: "EU",
        personColor: "#22c55e",
        category: "Tech",
        isOwner: true,
      },
      {
        id: 3,
        title: "PlayStation 5",
        current: 9,
        total: 12,
        cardId: "xp",
        amount: 416.67,
        personName: "Carlos M.",
        personInitials: "CM",
        personColor: "#ec4899",
        category: "Games",
        isOwner: false,
      },
      {
        id: 7,
        title: "iPhone 15 Pro",
        current: 10,
        total: 18,
        cardId: "xp",
        amount: 458.33,
        personName: "Pedro A.",
        personInitials: "PA",
        personColor: "#06b6d4",
        category: "Tech",
        isOwner: false,
      },
    ],
  },
};

export function fmt(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
