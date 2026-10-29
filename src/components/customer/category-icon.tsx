import { Coffee, Croissant, Dumbbell, Pill, Scissors, ShoppingBag, ShoppingBasket, Store, UtensilsCrossed, type LucideIcon } from "lucide-react";

const icons: Record<string, LucideIcon> = {
  utensils: UtensilsCrossed,
  coffee: Coffee,
  basket: ShoppingBasket,
  scissors: Scissors,
  bag: ShoppingBag,
  pill: Pill,
  croissant: Croissant,
  dumbbell: Dumbbell,
  store: Store,
};

export function CategoryIcon({ name, className }: { name: string; className?: string }) {
  const Icon = icons[name] ?? Store;
  return <Icon className={className} aria-hidden="true" stroke="url(#spotzi-icon)" />;
}
