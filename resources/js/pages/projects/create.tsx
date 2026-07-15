import ProjectFormFields, { type ClientOption, type ProjectFormData } from '@/components/project-form-fields';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { ArrowLeft, Plus } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Projects', href: '/projects' },
    { title: 'New Project', href: '/projects/create' },
];

interface Props {
    clients: ClientOption[];
}

export default function CreateProject({ clients }: Props) {
    const { data, setData, post, processing, errors } = useForm<ProjectFormData>({
        client_id: '',
        name: '',
        location: '',
        status: 'draft',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('projects.store'));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="New Project" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div>
                    <Button variant="ghost" size="sm" onClick={() => window.history.back()} className="gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Button>
                </div>
                <div className="mx-auto w-full max-w-2xl">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Plus className="h-5 w-5" />
                                New Project
                            </CardTitle>
                            <CardDescription>Create a construction project for a client. You'll add BOQs next.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <ProjectFormFields data={data} setData={setData} errors={errors} clients={clients} />
                                <div className="flex gap-4">
                                    <Button type="submit" disabled={processing || clients.length === 0} className="gap-2">
                                        <Plus className="h-4 w-4" />
                                        {processing ? 'Saving...' : 'Create Project'}
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
