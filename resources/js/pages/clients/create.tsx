import ClientFormFields, { type ClientFormData } from '@/components/client-form-fields';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { ArrowLeft, Plus } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Clients', href: '/clients' },
    { title: 'Add Client', href: '/clients/create' },
];

export default function CreateClient() {
    const { data, setData, post, processing, errors } = useForm<ClientFormData>({
        name: '',
        company_name: '',
        email: '',
        phone: '',
        phone_secondary: '',
        whatsapp: '',
        cnic: '',
        address: '',
        city: '',
        province: '',
        postal_code: '',
        notes: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('clients.store'));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Add Client" />
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
                                <Plus className="h-5 w-5" />
                                Add New Client
                            </CardTitle>
                            <CardDescription>Record the client's contact and identification details.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <ClientFormFields data={data} setData={setData} errors={errors} />
                                <div className="flex gap-4">
                                    <Button type="submit" disabled={processing} className="gap-2">
                                        <Plus className="h-4 w-4" />
                                        {processing ? 'Saving...' : 'Create Client'}
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
