import { useEffect, useState } from "react";
import HomeScreen from "./screens/HomeScreen";
import FutureExpensesScreen from "./screens/FutureExpensesScreen";
import AddExpenseScreen from "./screens/AddExpenseScreen";
import DebtorsScreen from "./screens/DebtorsScreen";
import DebtorProfileScreen from "./screens/DebtorProfileScreen";
import SettingsScreen from "./screens/SettingsScreen";
import { cardUsed } from "./utils/finance";
import AuthScreen from "./screens/AuthScreen";
import { readAuth, createAuth, verifyAuth, isSessionActive, setSession, type Auth } from "./utils/auth";
import AddCardScreen from "./screens/AddCardScreen";
import type {
  Screen,
  Friend,
  Card,
  Expense,
  FixedExpense,
  Debt,
} from "./data/mockData";
import {
  CARDS as INITIAL_CARDS,
  FRIENDS as INITIAL_FRIENDS,
  TOP_EXPENSES as INITIAL_EXPENSES,
  INITIAL_FIXED_EXPENSES,
  INITIAL_SALARY,
} from "./data/mockData";
import { syncFriend } from "./utils/finance";
import { S, applyTheme, readStoredTheme, storeTheme, type ThemeMode } from "./theme";
import { HomeIcon, CalendarIcon, PeopleIcon, GearIcon } from "./components/NavIcons";

const STORAGE_KEY = "finance-app-state-v1";


interface NavItem {
  screen: Screen;
  icon: string;
  label: string;
  color?: string;
}

const NAV_ICONS: Record<string, typeof HomeIcon> = {
  home: HomeIcon,
  future: CalendarIcon,
  debtors: PeopleIcon,
  settings: GearIcon,
};

const NAV: NavItem[] = [
  { screen: "home", icon: "", label: "Home", color: "#a855f7" },
  { screen: "future", icon: "", label: "Projeção", color: "#3b82f6" },
  { screen: "addExpense", icon: "+", label: "Novo" },
  { screen: "debtors", icon: "", label: "Devedores", color: "#f97316" },
  { screen: "settings", icon: "", label: "Config", color: "#14b8a6" },
];

function readStoredState() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [routeData, setRouteData] = useState<unknown>(null);
  const [tabScreen, setTabScreen] = useState<Screen>("home");
  const [cards, setCards] = useState<Card[]>(
    () => readStoredState()?.cards ?? [],
  );
  const [friends, setFriends] = useState<Friend[]>(() =>
    (readStoredState()?.friends ?? []).map(syncFriend),
  );
  const [expenses, setExpenses] = useState<Expense[]>(
    () => readStoredState()?.expenses ?? [],
  );
  const [auth, setAuth] = useState<Auth | null>(readAuth);
  const [loggedIn, setLoggedIn] = useState<boolean>(isSessionActive);
  const [theme, setTheme] = useState<ThemeMode>(readStoredTheme);
  applyTheme(theme);
  const toggleTheme = () => {
    const next: ThemeMode = theme === "dark" ? "light" : "dark";
    storeTheme(next);
    setTheme(next);
  };
  const [userName, setUserName] = useState<string>(
    () => readStoredState()?.userName ?? "",
  );
  const [salary, setSalary] = useState<number>(
    () => readStoredState()?.salary ?? 0,
  );
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>(
    () => readStoredState()?.fixedExpenses ?? [],
  );

  useEffect(() => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        cards,
        friends,
        expenses,
        salary,
        fixedExpenses,
        userName,
      }),
    );
  }, [cards, friends, expenses, salary, fixedExpenses, userName]);

  const navigate = (s: Screen, data?: unknown) => {
    setScreen(s);
    setRouteData(data ?? null);
    if (NAV.some((n) => n.screen === s)) {
      setTabScreen(s);
    }
  };

  const handleTabPress = (s: Screen) => {
    setTabScreen(s);
    setScreen(s);
    setRouteData(null);
  };

  const addCard = (card: Card) => {
    setCards((prev) => [...prev, card]);
  };

  const removeCard = (cardId: string) => {
    // só exclui se não houver nada em aberto no cartão
    if (cardUsed(cardId, expenses, friends, fixedExpenses) > 0) return;
    setFixedExpenses((prev) =>
      prev.map((fe) => (fe.cardId === cardId ? { ...fe, cardId: undefined } : fe)),
    );
    setCards((prev) => prev.filter((card) => card.id !== cardId));
    setExpenses((prev) => prev.filter((expense) => expense.cardId !== cardId));
  };

  const updateCard = (updatedCard: Card) => {
    setCards((prev) =>
      prev.map((card) => (card.id === updatedCard.id ? updatedCard : card)),
    );
  };

  const removeDebtor = (friendId: string) => {
    setFriends((prev) => prev.filter((friend) => friend.id !== friendId));
  };

  const clearAllData = () => {
    setCards([]);
    setFriends([]);
    setExpenses([]);
    setSalary(0);
    setFixedExpenses([]);
    window.localStorage.removeItem(STORAGE_KEY);
  };

  const addExpense = (expense: Expense) => {
    setExpenses((prev) => [expense, ...prev]);
  };

  const removeExpense = (expenseId: string) => {
    setExpenses((prev) => prev.filter((expense) => expense.id !== expenseId));
  };

  const addDebtor = (friend: Friend) => {
    setFriends((prev) => [syncFriend(friend), ...prev.map(syncFriend)]);
  };

  const markDebtorPaid = (friendId: string) => {
    setFriends((prev) =>
      prev.map((friend) =>
        friend.id === friendId
          ? syncFriend({ ...friend, status: "paid", totalOwed: 0, debts: [] })
          : friend,
      ),
    );
  };

  const addDebtToFriend = (friendId: string, debt: Debt) => {
    setFriends((prev) =>
      prev.map((friend) => {
        if (friend.id !== friendId) return friend;
        return syncFriend({ ...friend, debts: [debt, ...friend.debts] });
      }),
    );
  };

  const deleteDebt = (friendId: string, debtId: string) => {
    setFriends((prev) =>
      prev.map((friend) => {
        if (friend.id !== friendId) return friend;
        return syncFriend({
          ...friend,
          debts: friend.debts.filter((debt) => debt.id !== debtId),
        });
      }),
    );
  };

  const markDebtPaid = (friendId: string, debtId: string) => {
    setFriends((prev) =>
      prev.map((friend) => {
        if (friend.id !== friendId) return friend;
        return syncFriend({
          ...friend,
          debts: friend.debts.map((debt) =>
            debt.id === debtId
              ? { ...debt, paid: true, paidMonth: new Date().toISOString().slice(0, 7) }
              : debt,
          ),
        });
      }),
    );
  };

  const updateSalary = (value: number) => {
    setSalary(value);
  };

  const toggleFixedExpense = (expenseId: string) => {
    setFixedExpenses((prev) =>
      prev.map((item) =>
        item.id === expenseId ? { ...item, active: !item.active } : item,
      ),
    );
  };

  const addFixedExpense = (expense: FixedExpense) => {
    setFixedExpenses((prev) => [expense, ...prev]);
  };

  const updateFixedExpense = (expense: FixedExpense) => {
    setFixedExpenses((prev) =>
      prev.map((item) => (item.id === expense.id ? expense : item)),
    );
  };

  const toggleExpensePaid = (expenseId: string) => {
    setExpenses((prev) =>
      prev.map((item) =>
        item.id === expenseId ? { ...item, paid: !item.paid } : item,
      ),
    );
  };

  const reactivateDebt = (friendId: string, debtId: string) => {
    setFriends((prev) =>
      prev.map((friend) =>
        friend.id !== friendId
          ? friend
          : syncFriend({
              ...friend,
              debts: friend.debts.map((debt) =>
                debt.id === debtId
                  ? { ...debt, paid: false, paidMonth: undefined }
                  : debt,
              ),
            }),
      ),
    );
  };

  const updateFriendInfo = (friendId: string, name: string, phone: string) => {
    const initials = name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join("");
    setFriends((prev) =>
      prev.map((friend) =>
        friend.id === friendId ? { ...friend, name, phone, initials } : friend,
      ),
    );
  };

  const updateFriendPix = (friendId: string, pix: string) => {
    setFriends((prev) =>
      prev.map((friend) => (friend.id === friendId ? { ...friend, pix } : friend)),
    );
  };

  const removeFixedExpense = (expenseId: string) => {
    setFixedExpenses((prev) => prev.filter((item) => item.id !== expenseId));
  };

  const showNav = !["addExpense", "addCard"].includes(screen);
  const currentFriend =
    typeof routeData === "object" && routeData !== null && "friend" in routeData
      ? (routeData as { friend: Friend }).friend
      : typeof routeData === "object" && routeData !== null && "id" in routeData
        ? (friends.find((friend) => friend.id === (routeData as Friend).id) ??
          (routeData as Friend))
        : null;

  const cardUsage: Record<string, number> = Object.fromEntries(
    cards.map((c) => [c.id, cardUsed(c.id, expenses, friends, fixedExpenses)]),
  );

  if (!auth) {
    return (
      <AuthScreen
        key={`${theme}-register`}
        mode="register"
        initialName={userName}
        onSubmit={async (name, password) => {
          const created = await createAuth(name, password);
          setAuth(created);
          setUserName(created.name);
          setSession(true);
          setLoggedIn(true);
          return null;
        }}
      />
    );
  }

  if (!loggedIn) {
    return (
      <AuthScreen
        key={`${theme}-login`}
        mode="login"
        initialName={auth.name}
        onSubmit={async (name, password) => {
          if (!(await verifyAuth(auth, name, password))) {
            return "Nome ou senha incorretos.";
          }
          setUserName(auth.name);
          setSession(true);
          setLoggedIn(true);
          return null;
        }}
      />
    );
  }

  return (
    <div
      key={theme}
      style={{
        background: S.bg,
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 430,
          minHeight: "100vh",
          background: S.bg,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <button
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Mudar para tema claro" : "Mudar para tema escuro"}
          style={{
            position: "absolute",
            top: 10,
            right: 14,
            zIndex: 60,
            width: 34,
            height: 34,
            borderRadius: "50%",
            border: `1px solid ${S.border}`,
            background: S.surface,
            fontSize: 16,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {theme === "dark" ? "☀️" : "🌙"}
        </button>
        <div
          style={{ height: "100%", overflowY: "auto" }}
          className="scrollbar-hide"
        >
          {screen === "home" && (
            <HomeScreen
              navigate={navigate}
              cards={cards}
              friends={friends}
              expenses={expenses}
              fixedExpenses={fixedExpenses}
              salary={salary}
              userName={userName}
              onLogout={() => {
                setSession(false);
                setLoggedIn(false);
              }}
              onRemoveExpense={removeExpense}
              onTogglePaid={toggleExpensePaid}
            />
          )}
          {screen === "future" && (
            <FutureExpensesScreen
              friends={friends}
              expenses={expenses}
              fixedExpenses={fixedExpenses}
              salary={salary}
              cards={cards}
            />
          )}
          {screen === "addExpense" && (
            <AddExpenseScreen
              navigate={navigate}
              cards={cards}
              friends={friends}
              cardUsage={cardUsage}
              onAddExpense={addExpense}
              onAddDebt={addDebtToFriend}
              routeData={routeData}
              onGoToDebtor={navigate}
            />
          )}
          {screen === "debtors" && (
            <DebtorsScreen
              navigate={navigate}
              friends={friends}
              onAddDebtor={addDebtor}
              onMarkPaid={markDebtorPaid}
              onRemoveDebtor={removeDebtor}
            />
          )}
          {screen === "debtorProfile" && currentFriend && (
            <DebtorProfileScreen
              navigate={navigate}
              friend={currentFriend}
              cardUsage={cardUsage}
              cards={cards}
              onAddDebt={addDebtToFriend}
              onReactivateDebt={reactivateDebt}
              onUpdatePix={updateFriendPix}
              onUpdateFriend={updateFriendInfo}
              onMarkDebtPaid={markDebtPaid}
              onDeleteDebt={deleteDebt}
              initialOpenAddDebt={Boolean(
                routeData &&
                typeof routeData === "object" &&
                "openAddDebt" in routeData &&
                routeData.openAddDebt,
              )}
            />
          )}
          {screen === "settings" && (
            <SettingsScreen
              cardUsage={cardUsage}
              navigate={navigate}
              cards={cards}
              expenses={expenses}
              friends={friends}
              salary={salary}
              fixedExpenses={fixedExpenses}
              onUpdateFixedExpense={updateFixedExpense}
              onRemoveFixedExpense={removeFixedExpense}
              onRemoveCard={removeCard}
              onEditCard={(card) => navigate("addCard", { mode: "edit", card })}
              onUpdateSalary={updateSalary}
              onToggleFixedExpense={toggleFixedExpense}
              onAddFixedExpense={addFixedExpense}
              onClearAll={clearAllData}
              onLogout={() => {
                setSession(false);
                setLoggedIn(false);
              }}
            />
          )}
          {screen === "addCard" && (
            <AddCardScreen
              navigate={navigate}
              onAddCard={addCard}
              onUpdateCard={updateCard}
              onRemoveCard={removeCard}
              routeData={routeData}
            />
          )}
        </div>

        {showNav && (
          <div
            style={{
              position: "fixed",
              bottom: 0,
              left: "50%",
              transform: "translateX(-50%)",
              width: "100%",
              maxWidth: 430,
              background: `${S.surface}f0`,
              backdropFilter: "blur(20px)",
              borderTop: `1px solid ${S.border}`,
              display: "flex",
              alignItems: "center",
              paddingBottom: "env(safe-area-inset-bottom, 0px)",
              zIndex: 50,
            }}
          >
            {NAV.map((item) => {
              const active = tabScreen === item.screen;
              const isAdd = item.screen === "addExpense";
              return (
                <button
                  key={item.screen}
                  onClick={() => handleTabPress(item.screen)}
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    padding: isAdd ? "8px 0 12px" : "10px 0 12px",
                    border: "none",
                    background: "none",
                    cursor: "pointer",
                    gap: 3,
                  }}
                >
                  {isAdd ? (
                    <div
                      style={{
                        width: 46,
                        height: 46,
                        borderRadius: "50%",
                        marginTop: -14,
                        background: `linear-gradient(135deg, #7c3aed, ${S.purple})`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 22,
                        color: "#fff",
                        fontWeight: 300,
                        boxShadow: `0 0 20px ${S.purple}70, 0 4px 14px rgba(0,0,0,0.5)`,
                        border: `2px solid ${S.bg}`,
                      }}
                    >
                      +
                    </div>
                  ) : (
                    <span
                      style={{
                        display: "flex",
                        opacity: active ? 1 : 0.55,
                        transition: "opacity 0.18s",
                      }}
                    >
                      {(() => {
                        const Icon = NAV_ICONS[item.screen];
                        return (
                          <Icon
                            size={22}
                            color={active ? item.color : S.muted}
                          />
                        );
                      })()}
                    </span>
                  )}
                  {!isAdd && (
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: active ? 700 : 400,
                        color: active ? (item.color ?? S.purple) : S.muted,
                        fontFamily: "'JetBrains Mono', monospace",
                        letterSpacing: "0.05em",
                        transition: "color 0.18s",
                      }}
                    >
                      {item.label}
                    </span>
                  )}
                  {active && !isAdd && (
                    <div
                      style={{
                        width: 4,
                        height: 4,
                        borderRadius: "50%",
                        background: S.purple,
                        boxShadow: `0 0 6px ${S.purple}`,
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
