import ContractFormFields, { type ContractFormData, type ContractProject } from '@/components/contract-form-fields';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { ArrowLeft, Plus } from 'lucide-react';

interface Props {
    project: ContractProject;
    contract: ContractFormData;
}

export default function CreateContract({ project, contract }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Projects', href: '/projects' },
        { title: project.name, href: `/projects/${project.id}` },
        { title: 'New Contract', href: `/projects/${project.id}/contracts/create` },
    ];

    const { data, setData, post, processing, errors } = useForm<ContractFormData>(contract);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('contracts.store', project.id));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="New Contract" />
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
                                <Plus className="h-5 w-5" />
                                New Contract
                            </CardTitle>
                            <CardDescription>
                                The commercial agreement for {project.name}. A client may sign more than one — grey structure now,
                                finishing later.
                            </CardDescription>
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
                                        <Plus className="h-4 w-4" />
                                        {processing ? 'Saving...' : 'Create Contract'}
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
