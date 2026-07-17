import ContractFormFields, { type ContractFormData, type ContractProject } from '@/components/contract-form-fields';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';

interface Props {
    project: ContractProject;
    contract: ContractFormData & { id: number };
}

export default function EditContract({ project, contract }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Projects', href: '/projects' },
        { title: project.name, href: `/projects/${project.id}` },
        { title: `Edit ${contract.title}`, href: `/contracts/${contract.id}/edit` },
    ];

    const { data, setData, put, processing, errors } = useForm<ContractFormData>(contract);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('contracts.update', contract.id));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${contract.title}`} />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div>
                    <Button variant="ghost" size="sm" onClick={() => window.history.back()} className="gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Button>
                </div>
                <div className="mx-auto w-full max-w-4xl">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Save className="h-5 w-5" />
                                Edit Contract
                            </CardTitle>
                            <CardDescription>{project.name}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <ContractFormFields
                                    data={data}
                                    setData={setData}
                                    errors={errors as Record<string, string>}
                                    project={project}
                                />
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
