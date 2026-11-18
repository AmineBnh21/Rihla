import Link from "next/link";
import { ArrowRight } from "lucide-react";

type Variant = "primary" | "secondary";

type CommonProps = {
  children: string;
  variant?: Variant;
  className?: string;
};

type LinkProps = CommonProps & {
  href: string;
  external?: boolean;
  /** Lien partenaire (affiliation) : rel="sponsored". */
  sponsored?: boolean;
};
type ButtonProps = CommonProps & {
  href?: undefined;
  type?: "button" | "submit";
  disabled?: boolean;
};

export type PillButtonProps = LinkProps | ButtonProps;

const base =
  "group inline-flex min-h-12 items-center gap-3 rounded-full py-1.5 pl-6 pr-1.5 text-sm font-medium uppercase tracking-wide transition-colors motion-reduce:transition-none";

const variants: Record<Variant, { root: string; circle: string; arrow: string }> = {
  primary: {
    root: "bg-primary text-surface hover:bg-primary-dark",
    circle: "bg-surface",
    arrow: "text-primary",
  },
  secondary: {
    root: "border border-ink/20 bg-surface text-ink hover:border-ink",
    circle: "bg-primary",
    arrow: "text-surface",
  },
};

const disabledClasses = "cursor-not-allowed opacity-60";

/**
 * Bouton pilule : libellé en majuscules et flèche dans un cercle.
 * Au survol, le libellé glisse vers le haut et une copie arrive par le bas ;
 * la flèche se décale. Aucun mouvement avec prefers-reduced-motion.
 */
export default function PillButton(props: PillButtonProps) {
  const { children, variant = "primary", className = "" } = props;
  const v = variants[variant];
  const isDisabled = props.href === undefined && props.disabled === true;
  const animate = isDisabled
    ? ""
    : "motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out";

  const content = (
    <>
      <span className="relative block overflow-hidden">
        <span
          className={`block ${animate} ${isDisabled ? "" : "motion-safe:group-hover:-translate-y-full motion-safe:group-focus-visible:-translate-y-full"}`}
        >
          {children}
        </span>
        <span
          aria-hidden="true"
          className={`absolute inset-0 block translate-y-full ${animate} ${isDisabled ? "" : "motion-safe:group-hover:translate-y-0 motion-safe:group-focus-visible:translate-y-0"} motion-reduce:hidden`}
        >
          {children}
        </span>
      </span>
      <span
        aria-hidden="true"
        className={`flex size-9 shrink-0 items-center justify-center rounded-full ${v.circle}`}
      >
        <ArrowRight
          className={`size-4 ${v.arrow} ${animate} ${isDisabled ? "" : "motion-safe:group-hover:translate-x-0.5 motion-safe:group-focus-visible:translate-x-0.5"}`}
        />
      </span>
    </>
  );

  const classes = `${base} ${v.root} ${isDisabled ? disabledClasses : ""} ${className}`;

  if (props.href !== undefined) {
    if (props.external) {
      return (
        <a
          href={props.href}
          className={classes}
          target="_blank"
          rel={props.sponsored ? "sponsored noopener noreferrer" : "noopener noreferrer"}
        >
          {content}
        </a>
      );
    }
    return (
      <Link href={props.href} className={classes}>
        {content}
      </Link>
    );
  }

  return (
    <button type={props.type ?? "button"} disabled={props.disabled} className={classes}>
      {content}
    </button>
  );
}
