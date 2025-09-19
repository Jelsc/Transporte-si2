import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Loader2, Check, ChevronsUpDown, User, Car } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Usuario, UsuarioFormData, Role } from '@/types';

// Esquema base (común a crear/editar)
const baseUsuarioSchema = z.object({
  username: z.string().min(3, 'El username debe tener al menos 3 caracteres'),
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  apellido: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  telefono: z.string().min(8, 'El teléfono debe tener al menos 8 caracteres'),
  rol_id: z.number().optional(),
  is_admin_portal: z.boolean(),
  personal_id: z.number().optional(),
  conductor_id: z.number().optional(),
  password: z.string().optional(),
  password_confirm: z.string().optional(),
}) satisfies z.ZodType<UsuarioFormData>;

// Crear: password requerido y debe coincidir
const createUsuarioSchema = baseUsuarioSchema.extend({
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  password_confirm: z.string().min(6, 'Confirmación requerida'),
}).refine((data) => data.password === data.password_confirm, {
  message: 'Las contraseñas deben coincidir',
  path: ['password_confirm'],
});

// Editar: password opcional, si se envía debe coincidir
const editUsuarioSchema = baseUsuarioSchema.refine((data) => {
  if (data.password || data.password_confirm) {
    return data.password === data.password_confirm;
  }
  return true;
}, {
  message: 'Las contraseñas deben coincidir',
  path: ['password_confirm'],
});

interface UsuarioStoreProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UsuarioFormData) => Promise<boolean>;
  initialData?: Usuario | null;
  loading?: boolean;
  roles: Role[];
  personalDisponible: Array<{
    id: number;
    nombre: string;
    apellido: string;
    email: string;
    ci: string;
    telefono: string;
  }>;
  conductoresDisponibles: Array<{
    id: number;
    personal__nombre: string;
    personal__apellido: string;
    personal__email: string;
    personal__ci: string;
    personal__telefono: string;
    nro_licencia: string;
  }>;
}

export function UsuarioStore({ 
  isOpen, 
  onClose, 
  onSubmit, 
  initialData, 
  loading = false,
  roles,
  personalDisponible,
  conductoresDisponibles
}: UsuarioStoreProps) {
  const isEdit = !!initialData;
  const title = isEdit ? 'Editar Usuario' : 'Crear Usuario';
  const description = isEdit 
    ? 'Modifica la información del usuario seleccionado' 
    : 'Agrega un nuevo usuario al sistema';

  const [personalOpen, setPersonalOpen] = React.useState(false);
  const [conductorOpen, setConductorOpen] = React.useState(false);

  const form = useForm<UsuarioFormData>({
    resolver: zodResolver(isEdit ? editUsuarioSchema : createUsuarioSchema),
    defaultValues: {
      username: '',
      nombre: '',
      apellido: '',
      email: '',
      telefono: '',
      rol_id: undefined,
      is_admin_portal: false,
      personal_id: undefined,
      conductor_id: undefined,
      password: undefined,
      password_confirm: undefined,
    },
  });

  // Cargar datos iniciales cuando se abre el modal en modo edición
  useEffect(() => {
    if (isOpen && initialData) {
      form.reset({
        username: initialData.username,
        nombre: initialData.nombre,
        apellido: initialData.apellido,
        email: initialData.email,
        telefono: initialData.telefono,
        rol_id: initialData.rol_obj?.id,
        is_admin_portal: initialData.is_admin_portal,
        personal_id: initialData.personal_id,
        conductor_id: initialData.conductor_id,
        password: undefined,
        password_confirm: undefined,
      });
    } else if (isOpen && !initialData) {
      // Resetear formulario para crear nuevo
      form.reset({
        username: '',
        nombre: '',
        apellido: '',
        email: '',
        telefono: '',
        rol_id: undefined,
        is_admin_portal: false,
        personal_id: undefined,
        conductor_id: undefined,
        password: undefined,
        password_confirm: undefined,
      });
    }
  }, [isOpen, initialData, form]);

  const handleSubmit = async (data: UsuarioFormData) => {
    const success = await onSubmit(data);
    if (success) {
      form.reset();
      onClose();
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const handlePersonalSelect = (personalId: number) => {
    const personal = personalDisponible.find(p => p.id === personalId);
    if (personal) {
      form.setValue('personal_id', personalId);
      // Si selecciona personal, desvincular conductor para evitar conflictos
      form.setValue('conductor_id', undefined, { shouldDirty: true, shouldValidate: true });
      form.setValue('nombre', personal.nombre);
      form.setValue('apellido', personal.apellido);
      form.setValue('email', personal.email);
      form.setValue('telefono', personal.telefono);
    }
    setPersonalOpen(false);
  };

  const handleConductorSelect = (conductorId: number) => {
    const conductor = conductoresDisponibles.find(c => c.id === conductorId);
    if (conductor) {
      form.setValue('conductor_id', conductorId, { shouldDirty: true, shouldValidate: true });
      // Si selecciona conductor, desvincular personal para evitar conflictos
      form.setValue('personal_id', undefined, { shouldDirty: true, shouldValidate: true });
      form.setValue('nombre', conductor.personal__nombre);
      form.setValue('apellido', conductor.personal__apellido);
      form.setValue('email', conductor.personal__email);
      form.setValue('telefono', conductor.personal__telefono);
    }
    setConductorOpen(false);
  };

  const selectedPersonal = personalDisponible.find(p => p.id === form.watch('personal_id'));
  const selectedConductor = conductoresDisponibles.find(c => c.id === form.watch('conductor_id'));

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Username */}
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username *</FormLabel>
                    <FormControl>
                      <Input placeholder="Username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Nombre */}
              <FormField
                control={form.control}
                name="nombre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nombre" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Apellido */}
              <FormField
                control={form.control}
                name="apellido"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Apellido *</FormLabel>
                    <FormControl>
                      <Input placeholder="Apellido" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Teléfono */}
              <FormField
                control={form.control}
                name="telefono"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono *</FormLabel>
                    <FormControl>
                      <Input placeholder="Teléfono" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Rol (desde API) */}
              <FormField
                control={form.control}
                name="rol_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rol *</FormLabel>
                    <Select
                      onValueChange={(val) => field.onChange(val ? parseInt(val) : undefined)}
                      value={field.value !== undefined ? String(field.value) : ''}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar rol" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {roles.map((r) => (
                          <SelectItem key={r.id} value={String(r.id)}>
                            {r.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Personal (Autocompletado) */}
              <FormField
                control={form.control}
                name="personal_id"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Personal (Opcional)</FormLabel>
                    <Popover open={personalOpen} onOpenChange={setPersonalOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={personalOpen}
                            className="w-full justify-between"
                          >
                            {selectedPersonal
                              ? `${selectedPersonal.nombre} ${selectedPersonal.apellido}`
                              : "Seleccionar personal..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput placeholder="Buscar personal..." />
                          <CommandEmpty>No se encontró personal.</CommandEmpty>
                          <CommandGroup>
                            {personalDisponible.map((personal) => (
                              <CommandItem
                                key={personal.id}
                                value={`${personal.nombre} ${personal.apellido} ${personal.email}`}
                                onSelect={() => handlePersonalSelect(personal.id)}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    field.value === personal.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4" />
                                  <div>
                                    <div className="font-medium">
                                      {personal.nombre} {personal.apellido}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {personal.email} - {personal.ci}
                                    </div>
                                  </div>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Conductor (Autocompletado) */}
              <FormField
                control={form.control}
                name="conductor_id"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Conductor (Opcional)</FormLabel>
                    <Popover open={conductorOpen} onOpenChange={setConductorOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={conductorOpen}
                            className="w-full justify-between"
                          >
                            {selectedConductor
                              ? `${selectedConductor.personal__nombre} ${selectedConductor.personal__apellido}`
                              : "Seleccionar conductor..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput placeholder="Buscar conductor..." />
                          <CommandEmpty>No se encontraron conductores.</CommandEmpty>
                          <CommandGroup>
                            {conductoresDisponibles.map((conductor) => (
                              <CommandItem
                                key={conductor.id}
                                value={`${conductor.personal__nombre} ${conductor.personal__apellido} ${conductor.personal__email}`}
                                onSelect={() => handleConductorSelect(conductor.id)}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    field.value === conductor.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <div className="flex items-center gap-2">
                                  <Car className="h-4 w-4" />
                                  <div>
                                    <div className="font-medium">
                                      {conductor.personal__nombre} {conductor.personal__apellido}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      CI: {conductor.personal__ci}
                                    </div>
                                  </div>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Contraseñas (solo para creación) */}
            {!isEdit && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contraseña *</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Contraseña" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password_confirm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmar Contraseña *</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Confirmar contraseña" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Portal Administrativo */}
            <FormField
              control={form.control}
              name="is_admin_portal"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Acceso al Portal Administrativo</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      El usuario podrá acceder al panel de administración
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value || false}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEdit ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
