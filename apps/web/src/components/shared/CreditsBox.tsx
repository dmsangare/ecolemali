import { Phone, Mail, Code2, Sparkles } from "lucide-react";

interface CreditsBoxProps {
  variant?: "default" | "compact";
}

export function CreditsBox({ variant = "default" }: CreditsBoxProps) {
  const contact = {
    name: "Adama SANGARE",
    title: "Informaticien expert en solutions numeriques",
    phone: "+223 73 65 14 67",
    phoneClean: "+22373651467",
    email: "dmsangare@gmail.com",
  };

  if (variant === "compact") {
    return (
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground py-3">
        <Sparkles className="h-3 w-3" />
        <span>
          Developpe par <strong className="text-foreground">{contact.name}</strong>
        </span>
        <span className="text-muted-foreground/50">•</span>
        <a
          href={`tel:${contact.phoneClean}`}
          className="hover:text-foreground transition-colors"
        >
          {contact.phone}
        </a>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-muted/30 p-4 shadow-sm">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg">
          AS
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Code2 className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium text-primary uppercase tracking-wide">
              Developpe par
            </span>
          </div>

          <p className="font-bold text-sm">{contact.name}</p>
          <p className="text-xs text-muted-foreground italic mt-0.5">
            {contact.title}
          </p>

          <div className="flex flex-col gap-1.5 mt-3 pt-3 border-t border-muted-foreground/10">
            <a
              href={`tel:${contact.phoneClean}`}
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors group"
            >
              <Phone className="h-3 w-3 group-hover:text-primary" />
              <span className="group-hover:underline">{contact.phone}</span>
            </a>
            <a
              href={`mailto:${contact.email}`}
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors group"
            >
              <Mail className="h-3 w-3 group-hover:text-primary" />
              <span className="group-hover:underline truncate">{contact.email}</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
