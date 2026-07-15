import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AppLayout from "@/layouts/app-layout";
import { type BreadcrumbItem } from "@/types";
import { Head, useForm } from "@inertiajs/react";
import { ArrowLeft, Plus } from "lucide-react";

/** Display as +92 000 0000000 (10 national digits after country code 92). */
function formatPakistanCellphoneDisplay(input: string): string {
    const digits = input.replace(/\D/g, "");
    let national = digits;
    if (national.startsWith("92")) {
        national = national.slice(2);
    }
    if (national.startsWith("0")) {
        national = national.slice(1);
    }
    national = national.slice(0, 10);
    if (national.length === 0) {
        return "";
    }
    const first = national.slice(0, 3);
    const rest = national.slice(3);
    return rest.length > 0 ? `+92 ${first} ${rest}` : `+92 ${first}`;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Tenants',
        href: '/tenants',
    },
    {
        title: 'Create Tenant',
        href: '/tenants/create',
    },
];

export default function CreateTenant() {
    const { data, setData, post, processing, errors } = useForm({
        id: '',
        domain: '',
        owner_name: '',
        owner_email: '',
        owner_cellphone: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('tenants.store'));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Tenant" />
            
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.history.back()}
                        className="gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Button>
                </div>

                <div className="mx-auto w-full max-w-2xl">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Plus className="h-5 w-5" />
                                Create New Tenant
                            </CardTitle>
                            <CardDescription>
                                Add a new tenant to your application. Each tenant will have their own isolated environment.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="id">Tenant ID</Label>
                                    <Input
                                        id="id"
                                        type="text"
                                        value={data.id}
                                        onChange={(e) => setData('id', e.target.value)}
                                        placeholder="Enter tenant ID (e.g., acme-corp)"
                                        className={errors.id ? 'border-red-500' : ''}
                                        autoComplete="off"
                                    />
                                    {errors.id && (
                                        <p className="text-sm text-red-500">{errors.id}</p>
                                    )}
                                    <p className="text-sm text-muted-foreground">
                                        This will be the unique identifier for the tenant. Use lowercase letters, numbers, and hyphens only.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="domain">Domain</Label>
                                    <Input
                                        id="domain"
                                        type="text"
                                        value={data.domain}
                                        onChange={(e) => setData('domain', e.target.value)}
                                        placeholder="Enter domain (e.g., acme-corp)"
                                        className={errors.domain ? 'border-red-500' : ''}
                                        autoComplete="off"
                                    />
                                    {errors.domain && (
                                        <p className="text-sm text-red-500">{errors.domain}</p>
                                    )}
                                    <p className="text-sm text-muted-foreground">
                                        Enter the subdomain for this tenant (e.g., "acme-corp" will become "acme-corp.yourdomain.com"). The full domain will be automatically generated.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="owner_name">Owner Name</Label>
                                    <Input
                                        id="owner_name"
                                        type="text"
                                        value={data.owner_name}
                                        onChange={(e) => setData('owner_name', e.target.value)}
                                        placeholder="Enter owner's full name"
                                        className={errors.owner_name ? 'border-red-500' : ''}
                                        autoComplete="off"
                                    />
                                    {errors.owner_name && (
                                        <p className="text-sm text-red-500">{errors.owner_name}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="owner_email">Owner Email</Label>
                                    <Input
                                        id="owner_email"
                                        type="email"
                                        value={data.owner_email}
                                        onChange={(e) => setData('owner_email', e.target.value)}
                                        placeholder="Enter owner's email address"
                                        className={errors.owner_email ? 'border-red-500' : ''}
                                        autoComplete="off"
                                    />
                                    {errors.owner_email && (
                                        <p className="text-sm text-red-500">{errors.owner_email}</p>
                                    )}
                                    <p className="text-sm text-muted-foreground">
                                        The owner will receive an email to set their password after tenant provisioning completes.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="owner_cellphone">Owner Cellphone</Label>
                                    <Input
                                        id="owner_cellphone"
                                        type="text"
                                        inputMode="numeric"
                                        autoComplete="tel"
                                        value={data.owner_cellphone}
                                        onChange={(e) =>
                                            setData("owner_cellphone", formatPakistanCellphoneDisplay(e.target.value))
                                        }
                                        placeholder="+92 300 1234567"
                                        className={errors.owner_cellphone ? "border-red-500" : ""}
                                    />
                                    {errors.owner_cellphone && (
                                        <p className="text-sm text-red-500">{errors.owner_cellphone}</p>
                                    )}
                                    <p className="text-sm text-muted-foreground">
                                        Format: +92 followed by 10 digits (e.g. +92 300 1234567).
                                    </p>
                                </div>

                                <div className="flex gap-4">
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="gap-2"
                                    >
                                        <Plus className="h-4 w-4" />
                                        {processing ? 'Creating...' : 'Create Tenant'}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => window.history.back()}
                                    >
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