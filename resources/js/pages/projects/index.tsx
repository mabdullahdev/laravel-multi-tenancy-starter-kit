import ConfirmDialog from '@/components/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { FolderKanban, Plus, Trash2 } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Projects', href: '/projects' }];

interface ProjectRow {
    id: number;
    name: string;
    location: string | null;
    status: string;
    client_name: string | null;
    boqs_count: number;
}

interface Props {
    projects: ProjectRow[];
}

const statusVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
    active: 'default',
    completed: 'secondary',
    draft: 'outline',
    archived: 'outline',
};

export default function ProjectsIndex({ projects }: Props) {
    const handleDelete = (project: ProjectRow) => router.delete(route('projects.destroy', project.id));

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Projects" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="mb-2 flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Projects</h1>
                    <Link href={route('projects.create')}>
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            New Project
                        </Button>
                    </Link>
                </div>

                {projects.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                            <FolderKanban className="h-10 w-10 text-muted-foreground" />
                            <p className="text-muted-foreground">No projects yet. Create one to start building BOQs.</p>
                            <Link href={route('projects.create')}>
                                <Button variant="outline" className="gap-2">
                                    <Plus className="h-4 w-4" />
                                    New Project
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {projects.map((project) => (
                            <Card key={project.id} className="transition-colors hover:border-primary/50">
                                <CardContent className="flex flex-col gap-3 p-5">
                                    <div className="flex items-start justify-between gap-2">
                                        <Link href={route('projects.show', project.id)} className="font-semibold hover:underline">
                                            {project.name}
                                        </Link>
                                        <Badge variant={statusVariant[project.status] ?? 'outline'} className="capitalize">
                                            {project.status}
                                        </Badge>
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        <p>Client: {project.client_name ?? '—'}</p>
                                        {project.location && <p>Location: {project.location}</p>}
                                        <p>{project.boqs_count} BOQ{project.boqs_count === 1 ? '' : 's'}</p>
                                    </div>
                                    <div className="mt-auto flex items-center justify-between pt-2">
                                        <Link href={route('projects.show', project.id)}>
                                            <Button variant="outline" size="sm">Open</Button>
                                        </Link>
                                        <ConfirmDialog
                                            trigger={
                                                <Button variant="ghost" size="sm" className="gap-1 text-red-600 hover:text-red-700">
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            }
                                            title={`Delete project "${project.name}"?`}
                                            description="This permanently deletes the project and all of its BOQs. This cannot be undone."
                                            confirmLabel="Delete"
                                            confirmVariant="destructive"
                                            onConfirm={() => handleDelete(project)}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
