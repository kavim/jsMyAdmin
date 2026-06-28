import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Server, Database, User, Lock, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { DbType } from '@/types';

const loginSchema = z.object({
  type: z.enum(['mysql', 'mariadb', 'postgresql']),
  host: z.string().min(1, 'Host is required'),
  port: z.coerce.number().min(1).max(65535),
  username: z.string().min(1, 'Username is required'),
  password: z.string(),
  database: z.string().optional(),
});

type LoginForm = z.infer<typeof loginSchema>;

const defaultPorts: Record<DbType, number> = {
  mysql: 3306,
  mariadb: 3306,
  postgresql: 5432,
};

export default function LoginPage() {
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: '',
      database: '',
    },
  });

  const dbType = watch('type');

  const handleTypeChange = (type: DbType) => {
    setValue('type', type);
    setValue('port', defaultPorts[type]);
  };

  const onSubmit = (data: LoginForm) => {
    login.mutate({
      ...data,
      database: data.database || undefined,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Database className="h-8 w-8 text-primary" />
            <CardTitle className="text-2xl">JSMYADMIN</CardTitle>
          </div>
          <CardDescription className="text-center">
            Connect to your database server
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="type">Database Type</Label>
              <Select value={dbType} onValueChange={handleTypeChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mysql">MySQL</SelectItem>
                  <SelectItem value="mariadb">MariaDB</SelectItem>
                  <SelectItem value="postgresql">PostgreSQL</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="host">Host</Label>
              <div className="relative">
                <Server className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="host"
                  placeholder="localhost"
                  className="pl-9"
                  {...register('host')}
                />
              </div>
              {errors.host && <p className="text-xs text-destructive">{errors.host.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="port">Port</Label>
              <Input id="port" type="number" {...register('port')} />
              {errors.port && <p className="text-xs text-destructive">{errors.port.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="username"
                  placeholder="root"
                  className="pl-9"
                  {...register('username')}
                />
              </div>
              {errors.username && <p className="text-xs text-destructive">{errors.username.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  className="pl-9"
                  {...register('password')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="database">Database (optional)</Label>
              <div className="relative">
                <Database className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="database"
                  placeholder="mydb"
                  className="pl-9"
                  {...register('database')}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={login.isPending}>
              {login.isPending ? 'Connecting...' : 'Connect'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
