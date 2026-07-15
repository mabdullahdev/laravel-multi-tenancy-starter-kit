import ConfirmDialog from '@/components/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Pencil, Plus, Trash2, Users } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Clients', href: '/clients' }];

interface ClientRow {
    id: number;
    name: string;
    company_name: string | null;
    email: string | null;
    phone: string;
    city: string | null;
    projects_count: number;
}

interface Props {
    clients: ClientRow[];
}

export default function ClientsIndex({ clients }: Props) {
    const handleDelete = (client: ClientRow) => router.delete(route('clients.destroy', client.id));

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Clients" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="mb-2 flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Clients</h1>
                    <Link href={route('clients.create')}>
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            Add Client
                        </Button>
                    </Link>
                </div>

                {clients.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                            <Users className="h-10 w-10 text-muted-foreground" />
                            <p className="text-muted-foreground">No clients yet. Add your first client to get started.</p>
                            <Link href={route('clients.create')}>
                                <Button variant="outline" className="gap-2">
                                    <Plus className="h-4 w-4" />
                                    Add Client
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-left text-muted-foreground">
                                            <th className="px-4 py-3 font-medium">Name</th>
                                            <th className="px-4 py-3 font-medium">Company</th>
                                            <th className="px-4 py-3 font-medium">Phone</th>
                                            <th className="px-4 py-3 font-medium">City</th>
                                            <th className="px-4 py-3 font-medium">Projects</th>
                                            <th className="px-4 py-3 text-right font-medium">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {clients.map((client) => (
                                            <tr key={client.id} className="border-b last:border-0 hover:bg-muted/40">
                                                <td className="px-4 py-3 font-medium">{client.name}</td>
                                                <td className="px-4 py-3 text-muted-foreground">{client.company_name || '—'}</td>
                                                <td className="px-4 py-3">{client.phone}</td>
                                                <td className="px-4 py-3 text-muted-foreground">{client.city || '—'}</td>
                                                <td className="px-4 py-3">{client.projects_count}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Link href={route('clients.edit', client.id)}>
                                                            <Button variant="ghost" size="sm" className="gap-1">
                                                                <Pencil className="h-3.5 w-3.5" />
                                                                Edit
                                                            </Button>
                                                        </Link>
                                                        <ConfirmDialog
                                                            trigger={
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="gap-1 text-red-600 hover:text-red-700"
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                    Delete
                                                                </Button>
                                                            }
                                                            title={`Delete client "${client.name}"?`}
                                                            description="This permanently deletes the client along with all their projects and BOQs. This cannot be undone."
                                                            confirmLabel="Delete"
                                                            confirmVariant="destructive"
                                                            onConfirm={() => handleDelete(client)}
                                                        />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
