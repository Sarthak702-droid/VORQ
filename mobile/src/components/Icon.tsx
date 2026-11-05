import House from "lucide-react-native/icons/house";
import ReceiptText from "lucide-react-native/icons/receipt-text";
import ClipboardList from "lucide-react-native/icons/clipboard-list";
import Building2 from "lucide-react-native/icons/building-complex";
import Plus from "lucide-react-native/icons/plus";
import ArrowRight from "lucide-react-native/icons/arrow-right";
import ChevronRight from "lucide-react-native/icons/chevron-right";
import Check from "lucide-react-native/icons/check";
import MapPin from "lucide-react-native/icons/map-pin";
import Users from "lucide-react-native/icons/users";
import Clock3 from "lucide-react-native/icons/clock-3";
import ShieldCheck from "lucide-react-native/icons/shield-check";
import X from "lucide-react-native/icons/x";
import HardHat from "lucide-react-native/icons/hard-hat";
import CalendarDays from "lucide-react-native/icons/calendar-days";
import RefreshCw from "lucide-react-native/icons/refresh-cw";
import LogOut from "lucide-react-native/icons/log-out";
import Search from "lucide-react-native/icons/search";
import ChevronDown from "lucide-react-native/icons/chevron-down";
import Trash2 from "lucide-react-native/icons/trash";
import FileText from "lucide-react-native/icons/file-text";
import type { LucideIcon } from "lucide-react-native";
export type IconName =
  | "home"
  | "bill"
  | "site"
  | "projects"
  | "plus"
  | "arrow"
  | "chevron"
  | "check"
  | "pin"
  | "people"
  | "clock"
  | "shield"
  | "close"
  | "helmet"
  | "receipt"
  | "calendar"
  | "refresh"
  | "logout"
  | "search"
  | "down"
  | "trash"
  | "file";
const icons: Record<IconName, LucideIcon> = {
  home: House,
  bill: ReceiptText,
  site: ClipboardList,
  projects: Building2,
  plus: Plus,
  arrow: ArrowRight,
  chevron: ChevronRight,
  check: Check,
  pin: MapPin,
  people: Users,
  clock: Clock3,
  shield: ShieldCheck,
  close: X,
  helmet: HardHat,
  receipt: ReceiptText,
  calendar: CalendarDays,
  refresh: RefreshCw,
  logout: LogOut,
  search: Search,
  down: ChevronDown,
  trash: Trash2,
  file: FileText,
};
// All interface icons are unmodified components from the official Lucide package.
export function Icon({
  name,
  size = 22,
  color = "#2454A6",
}: {
  name: IconName;
  size?: number;
  color?: string;
}) {
  const Component = icons[name];
  return <Component size={size} color={color} strokeWidth={1.75} />;
}
