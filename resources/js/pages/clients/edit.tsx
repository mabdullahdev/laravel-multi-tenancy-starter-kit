import ClientFormFields, { type ClientFormData } from '@/components/client-form-fields';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';

interface Props {
    client: ClientFormData & { id: number };
}

export default function EditClient({ client }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Clients', href: '/clients' },
        { title: `Edit ${client.name}`, href: `/clients/${client.id}/edit` },
    ];

    const { data, setData, put, processing, errors } = useForm<ClientFormData>({
        name: client.name,
        company_name: client.company_name,
        email: client.email,
        phone: client.phone,
        phone_secondary: client.phone_secondary,
        whatsapp: client.whatsapp,
        cnic: client.cnic,
        address: client.address,
        city: client.city,
        province: client.province,
        postal_code: client.postal_code,
        notes: client.notes,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('clients.update', client.id));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${client.name}`} />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div>
                    <Button variant="ghost" size="sm" onClick={() => window.history.back()} className="gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Button>
                </div>
                <div className="mx-auto w-full max-w-3xl">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Save className="h-5 w-5" />
                                Edit Client
                            </CardTitle>
                            <CardDescription>Update this client's contact and identification details.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <ClientFormFields data={data} setData={setData} errors={errors} />
                                <div className="flex gap-4">
                                    <Button type="submit" disabled={processing} className="gap-2">
                                        <Save className="h-4 w-4" />
                                        {processing ? 'Saving...' : 'Save Changes'}
                                    </Button>
                                    <Button type="button" variant="outline" onClick={() => window.history.back()}>
                                        Cancel
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
