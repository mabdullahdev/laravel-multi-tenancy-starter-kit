import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

/** Display as +92 300 1234567 (10 national digits after country code 92). */
function formatPakistanPhone(input: string): string {
    const digits = input.replace(/\D/g, '');
    let national = digits;
    if (national.startsWith('92')) {
        national = national.slice(2);
    }
    if (national.startsWith('0')) {
        national = national.slice(1);
    }
    national = national.slice(0, 10);
    if (national.length === 0) {
        return '';
    }
    const first = national.slice(0, 3);
    const rest = national.slice(3);
    return rest.length > 0 ? `+92 ${first} ${rest}` : `+92 ${first}`;
}

/** Display as 00000-0000000-0 (Pakistan CNIC: 5-7-1 = 13 digits). */
function formatCnic(input: string): string {
    const digits = input.replace(/\D/g, '').slice(0, 13);
    const parts = [digits.slice(0, 5), digits.slice(5, 12), digits.slice(12, 13)].filter((p) => p.length > 0);
    return parts.join('-');
}

export interface ClientFormData {
    name: string;
    company_name: string;
    email: string;
    phone: string;
    phone_secondary: string;
    whatsapp: string;
    cnic: string;
    address: string;
    city: string;
    province: string;
    postal_code: string;
    notes: string;
    [key: string]: string;
}

interface Field {
    key: keyof ClientFormData;
    label: string;
    type?: string;
    required?: boolean;
    placeholder?: string;
    full?: boolean;
    /** Optional input mask applied on each change. */
    mask?: (value: string) => string;
}

const fields: Field[] = [
    { key: 'name', label: 'Contact Name', required: true, placeholder: 'e.g. Ahmed Khan' },
    { key: 'company_name', label: 'Company Name', placeholder: 'e.g. Khan Builders (optional)' },
    { key: 'phone', label: 'Primary Phone', required: true, placeholder: '+92 300 1234567', mask: formatPakistanPhone },
    { key: 'phone_secondary', label: 'Secondary Phone', placeholder: 'Optional', mask: formatPakistanPhone },
    { key: 'whatsapp', label: 'WhatsApp', placeholder: 'If different from phone', mask: formatPakistanPhone },
    { key: 'email', label: 'Email', type: 'email', placeholder: 'name@example.com' },
    { key: 'cnic', label: 'CNIC / Tax No.', placeholder: '00000-0000000-0', mask: formatCnic },
    { key: 'address', label: 'Address', placeholder: 'Street address', full: true },
    { key: 'city', label: 'City', placeholder: 'e.g. Lahore' },
    { key: 'province', label: 'Province', placeholder: 'e.g. Punjab' },
    { key: 'postal_code', label: 'Postal Code', placeholder: '54000' },
];

interface Props {
    data: ClientFormData;
    setData: (key: keyof ClientFormData, value: string) => void;
    errors: Partial<Record<keyof ClientFormData, string>>;
}

export default function ClientFormFields({ data, setData, errors }: Props) {
    return (
        <div className="grid gap-4 sm:grid-cols-2">
            {fields.map((field) => (
                <div key={field.key as string} className={`space-y-2 ${field.full ? 'sm:col-span-2' : ''}`}>
                    <Label htmlFor={field.key as string}>
                        {field.label}
                        {field.required && <span className="text-red-500"> *</span>}
                    </Label>
                    <Input
                        id={field.key as string}
                        type={field.type ?? 'text'}
                        inputMode={field.mask ? 'numeric' : undefined}
                        value={data[field.key]}
                        onChange={(e) => setData(field.key, field.mask ? field.mask(e.target.value) : e.target.value)}
                        placeholder={field.placeholder}
                        className={errors[field.key] ? 'border-red-500' : ''}
                        autoComplete="off"
                    />
                    {errors[field.key] && <p className="text-sm text-red-500">{errors[field.key]}</p>}
                </div>
            ))}

            <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                    id="notes"
                    value={data.notes}
                    onChange={(e) => setData('notes', e.target.value)}
                    placeholder="Anything else worth recording about this client"
                    rows={3}
                    className={errors.notes ? 'border-red-500' : ''}
                />
                {errors.notes && <p className="text-sm text-red-500">{errors.notes}</p>}
            </div>
        </div>
    );
}
