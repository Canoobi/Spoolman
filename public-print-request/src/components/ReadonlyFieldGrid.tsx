import type {ReactNode} from "react";

type Entry = {
    label: string;
    value: ReactNode;
};

type Props = {
    entries: Entry[];
};

export function ReadonlyFieldGrid({ entries }: Props) {
    return (
        <div className="readonly-grid">
            {entries.map((entry) => (
                <>
                    <div key={`${entry.label}-label`} className="readonly-grid__label">
                        {entry.label}
                    </div>
                    <div key={`${entry.label}-value`} className="readonly-grid__value">
                        {entry.value}
                    </div>
                </>
            ))}
        </div>
    );
}
