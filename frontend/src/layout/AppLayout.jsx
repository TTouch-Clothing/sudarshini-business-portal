import {
  Menu,
  LayoutDashboard,
  ShoppingBag,
  Users,
  Gem,
  CalendarDays,
  CalendarRange,
  BarChart3,
  Brain,
  Logs,
  KeyRound,
  UserCog,
  ShieldCheck,
  LogOut
} from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

const links = [
  { to: "/dashboard", label: "Dashboard", Icon: LayoutDashboard, roles: ["ADMIN", "EMPLOYEE"] },
  { to: "/dashboard/orders", label: "Orders", Icon: ShoppingBag, roles: ["ADMIN", "EMPLOYEE"] },
  { to: "/dashboard/customers", label: "Customers", Icon: Users, roles: ["ADMIN", "EMPLOYEE"] },
  { to: "/dashboard/vip-customers", label: "VIP Customers", Icon: Gem, roles: ["ADMIN", "EMPLOYEE"] },
  { to: "/dashboard/daily-sell", label: "Daily Sell", Icon: CalendarDays, roles: ["ADMIN"] },
  { to: "/dashboard/monthly-sell", label: "Monthly Sell", Icon: CalendarRange, roles: ["ADMIN"] },
  { to: "/dashboard/yearly-sell", label: "Yearly Sell", Icon: BarChart3, roles: ["ADMIN"] },
  { to: "/dashboard/prediction", label: "Prediction", Icon: Brain, roles: ["ADMIN", "EMPLOYEE"] },
  { to: "/dashboard/user-logs", label: "User Logs", Icon: Logs, roles: ["ADMIN", "EMPLOYEE"] },
  { to: "/dashboard/change-password", label: "Change Password", Icon: KeyRound, roles: ["ADMIN", "EMPLOYEE"] },
  { to: "/dashboard/change-profile", label: "Change Profile", Icon: UserCog, roles: ["ADMIN", "EMPLOYEE"] },
  { to: "/dashboard/admin-users", label: "Admin Users", Icon: ShieldCheck, roles: ["ADMIN"] }
];

export default function AppLayout() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await logout();
    } finally {
      navigate("/login");
    }
  }

  const allowedLinks = links.filter((link) =>
    link.roles.includes(user?.role || "EMPLOYEE")
  );

  return (
    <div className="layout">
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="brand">Sudarshini</div>

        <nav className="sidebar-menu">
          {allowedLinks.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/dashboard"}
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : ""}`
              }
              onClick={() => setOpen(false)}
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="logout-area">
          <button className="logout-btn" onClick={handleLogout} type="button">
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <button
            className="icon-btn mobile-only"
            onClick={() => setOpen(!open)}
            type="button"
          >
            <Menu size={18} />
          </button>

          <div className="top-user">
            <img
              src={user?.image || "https://ui-avatars.com/api/?name=User"}
              alt="user"
            />
            <span>
             {user?.name || "User"}
            </span>
          </div>
        </header>

        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}