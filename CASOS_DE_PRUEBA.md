# Casos de Prueba - Sistema de Transporte SI2

## 1. Casos de Prueba Backend

### 1.1 Validaciones de Unicidad

#### Test: CI Único en Personal
```python
def test_ci_unico_personal():
    """Verificar que no se puedan crear dos personal con la misma CI"""
    personal1 = Personal.objects.create(
        nombre="Juan", apellido="Pérez", ci="12345678",
        email="juan@test.com", telefono="123456789",
        fecha_nacimiento="1990-01-01"
    )
    
    with pytest.raises(ValidationError):
        personal2 = Personal.objects.create(
            nombre="Pedro", apellido="García", ci="12345678",  # Misma CI
            email="pedro@test.com", telefono="987654321",
            fecha_nacimiento="1985-05-15"
        )
```

#### Test: Email Único en Personal
```python
def test_email_unico_personal():
    """Verificar que no se puedan crear dos personal con el mismo email"""
    personal1 = Personal.objects.create(
        nombre="Juan", apellido="Pérez", ci="12345678",
        email="juan@test.com", telefono="123456789",
        fecha_nacimiento="1990-01-01"
    )
    
    with pytest.raises(ValidationError):
        personal2 = Personal.objects.create(
            nombre="Pedro", apellido="García", ci="87654321",
            email="juan@test.com",  # Mismo email
            telefono="987654321", fecha_nacimiento="1985-05-15"
        )
```

#### Test: Nro_licencia Único en Conductores
```python
def test_nro_licencia_unico_conductor():
    """Verificar que no se puedan crear dos conductores con la misma licencia"""
    personal1 = Personal.objects.create(
        nombre="Juan", apellido="Pérez", ci="12345678",
        email="juan@test.com", telefono="123456789",
        fecha_nacimiento="1990-01-01"
    )
    
    conductor1 = Conductor.objects.create(
        personal=personal1, nro_licencia="LIC001",
        tipo_licencia="B", fecha_venc_licencia="2025-12-31",
        experiencia_anios=5
    )
    
    personal2 = Personal.objects.create(
        nombre="Pedro", apellido="García", ci="87654321",
        email="pedro@test.com", telefono="987654321",
        fecha_nacimiento="1985-05-15"
    )
    
    with pytest.raises(ValidationError):
        conductor2 = Conductor.objects.create(
            personal=personal2, nro_licencia="LIC001",  # Misma licencia
            tipo_licencia="C", fecha_venc_licencia="2026-06-30",
            experiencia_anios=3
        )
```

### 1.2 Autocompletado de Usuarios

#### Test: Crear Usuario Vinculado a Personal
```python
def test_crear_usuario_vinculado_personal():
    """Verificar que se pueda crear un usuario vinculado a personal"""
    personal = Personal.objects.create(
        nombre="Juan", apellido="Pérez", ci="12345678",
        email="juan@test.com", telefono="123456789",
        fecha_nacimiento="1990-01-01"
    )
    
    rol = Rol.objects.create(
        nombre="Operador", descripcion="Operador del sistema",
        es_administrativo=True
    )
    
    user_data = {
        "username": "jperez",
        "email": "jperez@empresa.com",
        "first_name": "Juan",
        "last_name": "Pérez",
        "password": "testpass123",
        "password_confirm": "testpass123",
        "rol_id": rol.id,
        "personal_id": personal.id,
        "is_admin_portal": True
    }
    
    response = client.post("/api/users/", user_data)
    assert response.status_code == 201
    
    user = CustomUser.objects.get(username="jperez")
    assert user.personal == personal
    assert user.first_name == "Juan"
    assert user.last_name == "Pérez"
    assert user.email == "jperez@empresa.com"
```

#### Test: Crear Usuario Vinculado a Conductor
```python
def test_crear_usuario_vinculado_conductor():
    """Verificar que se pueda crear un usuario vinculado a conductor"""
    personal = Personal.objects.create(
        nombre="Pedro", apellido="García", ci="87654321",
        email="pedro@test.com", telefono="987654321",
        fecha_nacimiento="1985-05-15"
    )
    
    conductor = Conductor.objects.create(
        personal=personal, nro_licencia="LIC002",
        tipo_licencia="D", fecha_venc_licencia="2025-12-31",
        experiencia_anios=8
    )
    
    rol = Rol.objects.create(
        nombre="Conductor", descripcion="Conductor de vehículos",
        es_administrativo=False
    )
    
    user_data = {
        "username": "pgarcia",
        "email": "pgarcia@empresa.com",
        "first_name": "Pedro",
        "last_name": "García",
        "password": "testpass123",
        "password_confirm": "testpass123",
        "rol_id": rol.id,
        "conductor_id": conductor.id,
        "is_admin_portal": False
    }
    
    response = client.post("/api/users/", user_data)
    assert response.status_code == 201
    
    user = CustomUser.objects.get(username="pgarcia")
    assert user.conductor == conductor
    assert user.first_name == "Pedro"
    assert user.last_name == "García"
    assert user.email == "pgarcia@empresa.com"
```

### 1.3 Permisos y Acceso

#### Test: Solo Admin Puede Crear Usuarios
```python
def test_solo_admin_puede_crear_usuarios():
    """Verificar que solo administradores puedan crear usuarios"""
    # Crear usuario no admin
    user = CustomUser.objects.create_user(
        username="operador", email="operador@test.com",
        password="testpass123", is_admin_portal=False
    )
    
    client.force_authenticate(user=user)
    
    user_data = {
        "username": "nuevo_user",
        "email": "nuevo@test.com",
        "first_name": "Nuevo",
        "last_name": "Usuario",
        "password": "testpass123",
        "password_confirm": "testpass123",
        "rol_id": 1
    }
    
    response = client.post("/api/users/", user_data)
    assert response.status_code == 403
```

#### Test: Verificar Acceso al Panel Administrativo
```python
def test_acceso_panel_administrativo():
    """Verificar que solo usuarios con is_admin_portal=True puedan acceder"""
    # Usuario sin acceso admin
    user_no_admin = CustomUser.objects.create_user(
        username="cliente", email="cliente@test.com",
        password="testpass123", is_admin_portal=False
    )
    
    # Usuario con acceso admin
    user_admin = CustomUser.objects.create_user(
        username="admin", email="admin@test.com",
        password="testpass123", is_admin_portal=True
    )
    
    # Test login admin
    client.force_authenticate(user=user_admin)
    response = client.get("/api/admin/dashboard-data/")
    assert response.status_code == 200
    
    # Test login no admin
    client.force_authenticate(user=user_no_admin)
    response = client.get("/api/admin/dashboard-data/")
    assert response.status_code == 403
```

### 1.4 Registro Público

#### Test: Registro Público Siempre Crea Cliente
```python
def test_registro_publico_crea_cliente():
    """Verificar que el registro público siempre cree usuarios con rol Cliente"""
    register_data = {
        "username": "nuevo_cliente",
        "email": "cliente@test.com",
        "first_name": "Nuevo",
        "last_name": "Cliente",
        "password1": "testpass123",
        "password2": "testpass123"
    }
    
    response = client.post("/api/auth/registration/", register_data)
    assert response.status_code == 201
    
    user = CustomUser.objects.get(username="nuevo_cliente")
    assert user.rol.nombre == "Cliente"
    assert user.is_admin_portal == False
    assert user.email == "cliente@test.com"
```

## 2. Casos de Prueba Frontend

### 2.1 Formularios

#### Test: Validación de Campos Obligatorios
```typescript
describe('PersonalForm', () => {
  it('debe mostrar errores para campos obligatorios vacíos', async () => {
    render(<PersonalForm onSuccess={jest.fn()} onCancel={jest.fn()} />);
    
    const submitButton = screen.getByRole('button', { name: /guardar/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('El nombre es obligatorio')).toBeInTheDocument();
      expect(screen.getByText('El apellido es obligatorio')).toBeInTheDocument();
      expect(screen.getByText('El email es obligatorio')).toBeInTheDocument();
    });
  });
});
```

#### Test: Autocompletado de Datos
```typescript
describe('UsuarioForm', () => {
  it('debe autocompletar datos cuando se selecciona personal', async () => {
    const mockPersonal = {
      id: 1,
      nombre: 'Juan',
      apellido: 'Pérez',
      email: 'juan@test.com',
      telefono: '123456789',
      ci: '12345678'
    };
    
    jest.spyOn(usersService, 'getPersonalDisponible').mockResolvedValue({
      success: true,
      data: [mockPersonal]
    });
    
    render(<UsuarioForm onSuccess={jest.fn()} onCancel={jest.fn()} />);
    
    const personalSelect = screen.getByRole('combobox', { name: /personal/i });
    fireEvent.click(personalSelect);
    
    const option = screen.getByText('Juan Pérez');
    fireEvent.click(option);
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('Juan')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Pérez')).toBeInTheDocument();
      expect(screen.getByDisplayValue('juan@test.com')).toBeInTheDocument();
    });
  });
});
```

### 2.2 Tablas

#### Test: Búsqueda en Tabla
```typescript
describe('PersonalTable', () => {
  it('debe filtrar resultados al buscar', async () => {
    const mockPersonal = [
      { id: 1, nombre: 'Juan', apellido: 'Pérez', email: 'juan@test.com' },
      { id: 2, nombre: 'Pedro', apellido: 'García', email: 'pedro@test.com' }
    ];
    
    jest.spyOn(personalService, 'getPersonal').mockResolvedValue({
      success: true,
      data: { results: mockPersonal, count: 2 }
    });
    
    render(<AdminPersonalPage />);
    
    const searchInput = screen.getByPlaceholderText(/buscar/i);
    fireEvent.change(searchInput, { target: { value: 'Juan' } });
    
    await waitFor(() => {
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
      expect(screen.queryByText('Pedro García')).not.toBeInTheDocument();
    });
  });
});
```

### 2.3 Navegación

#### Test: Protección de Rutas Admin
```typescript
describe('AdminRoute', () => {
  it('debe redirigir usuarios sin acceso admin', () => {
    const mockUser = {
      id: 1,
      username: 'cliente',
      is_admin_portal: false
    };
    
    jest.spyOn(useAuth, 'useAuth').mockReturnValue({
      user: mockUser,
      isAuthenticated: true
    });
    
    render(
      <MemoryRouter>
        <AdminRoute>
          <div>Panel Admin</div>
        </AdminRoute>
      </MemoryRouter>
    );
    
    expect(screen.queryByText('Panel Admin')).not.toBeInTheDocument();
  });
});
```

## 3. Casos de Prueba de Integración

### 3.1 Flujo Completo de Creación de Usuario

#### Test: Crear Personal → Crear Usuario Vinculado
```python
def test_flujo_completo_personal_usuario():
    """Test del flujo completo: crear personal y luego usuario vinculado"""
    # 1. Crear personal
    personal_data = {
        "nombre": "María",
        "apellido": "López",
        "ci": "11223344",
        "email": "maria@test.com",
        "telefono": "555555555",
        "fecha_nacimiento": "1988-03-15"
    }
    
    response = client.post("/api/personal/", personal_data)
    assert response.status_code == 201
    personal_id = response.data['id']
    
    # 2. Crear rol
    rol = Rol.objects.create(
        nombre="Supervisor", descripcion="Supervisor de operaciones",
        es_administrativo=True
    )
    
    # 3. Crear usuario vinculado al personal
    user_data = {
        "username": "mlopez",
        "email": "mlopez@empresa.com",
        "first_name": "María",
        "last_name": "López",
        "password": "testpass123",
        "password_confirm": "testpass123",
        "rol_id": rol.id,
        "personal_id": personal_id,
        "is_admin_portal": True
    }
    
    response = client.post("/api/users/", user_data)
    assert response.status_code == 201
    
    # 4. Verificar que los datos se autocompletaron
    user = CustomUser.objects.get(username="mlopez")
    assert user.personal.id == personal_id
    assert user.first_name == "María"
    assert user.last_name == "López"
    assert user.email == "mlopez@empresa.com"
    assert user.is_admin_portal == True
```

### 3.2 Flujo Completo de Creación de Conductor

#### Test: Crear Personal → Crear Conductor → Crear Usuario
```python
def test_flujo_completo_personal_conductor_usuario():
    """Test del flujo completo: personal → conductor → usuario"""
    # 1. Crear personal
    personal_data = {
        "nombre": "Carlos",
        "apellido": "Mendoza",
        "ci": "99887766",
        "email": "carlos@test.com",
        "telefono": "666666666",
        "fecha_nacimiento": "1982-07-20"
    }
    
    response = client.post("/api/personal/", personal_data)
    assert response.status_code == 201
    personal_id = response.data['id']
    
    # 2. Crear conductor
    conductor_data = {
        "personal": personal_id,
        "nro_licencia": "LIC003",
        "tipo_licencia": "E",
        "fecha_venc_licencia": "2025-08-15",
        "experiencia_anios": 12
    }
    
    response = client.post("/api/conductores/", conductor_data)
    assert response.status_code == 201
    conductor_id = response.data['id']
    
    # 3. Crear rol conductor
    rol = Rol.objects.create(
        nombre="Conductor", descripcion="Conductor de vehículos",
        es_administrativo=False
    )
    
    # 4. Crear usuario vinculado al conductor
    user_data = {
        "username": "cmendoza",
        "email": "cmendoza@empresa.com",
        "first_name": "Carlos",
        "last_name": "Mendoza",
        "password": "testpass123",
        "password_confirm": "testpass123",
        "rol_id": rol.id,
        "conductor_id": conductor_id,
        "is_admin_portal": False
    }
    
    response = client.post("/api/users/", user_data)
    assert response.status_code == 201
    
    # 5. Verificar relaciones
    user = CustomUser.objects.get(username="cmendoza")
    conductor = Conductor.objects.get(id=conductor_id)
    personal = Personal.objects.get(id=personal_id)
    
    assert user.conductor == conductor
    assert conductor.personal == personal
    assert user.first_name == "Carlos"
    assert user.last_name == "Mendoza"
    assert conductor.nro_licencia == "LIC003"
    assert conductor.experiencia_anios == 12
```

## 4. Casos de Prueba de Rendimiento

### 4.1 Test de Carga de Datos

#### Test: Cargar 1000 Personal
```python
def test_carga_masiva_personal():
    """Test de rendimiento con 1000 registros de personal"""
    # Crear 1000 registros de personal
    personal_list = []
    for i in range(1000):
        personal_list.append(Personal(
            nombre=f"Nombre{i}",
            apellido=f"Apellido{i}",
            ci=f"CI{i:06d}",
            email=f"email{i}@test.com",
            telefono=f"555{i:06d}",
            fecha_nacimiento="1990-01-01"
        ))
    
    start_time = time.time()
    Personal.objects.bulk_create(personal_list)
    end_time = time.time()
    
    # Verificar que se crearon todos los registros
    assert Personal.objects.count() == 1000
    
    # Verificar que el tiempo de creación es razonable (< 5 segundos)
    assert (end_time - start_time) < 5.0
```

### 4.2 Test de Búsqueda

#### Test: Búsqueda en 1000 Registros
```python
def test_busqueda_rendimiento():
    """Test de rendimiento de búsqueda en 1000 registros"""
    # Crear datos de prueba
    for i in range(1000):
        Personal.objects.create(
            nombre=f"Nombre{i}",
            apellido=f"Apellido{i}",
            ci=f"CI{i:06d}",
            email=f"email{i}@test.com",
            telefono=f"555{i:06d}",
            fecha_nacimiento="1990-01-01"
        )
    
    # Test búsqueda por nombre
    start_time = time.time()
    results = Personal.objects.filter(nombre__icontains="Nombre500")
    end_time = time.time()
    
    assert results.count() > 0
    assert (end_time - start_time) < 0.1  # Menos de 100ms
```

## 5. Checklist de QA

### 5.1 Funcionalidad Básica

- [ ] Crear personal con todos los campos obligatorios
- [ ] Crear conductor vinculado a personal existente
- [ ] Crear usuario vinculado a personal existente
- [ ] Crear usuario vinculado a conductor existente
- [ ] Editar personal existente
- [ ] Editar conductor existente
- [ ] Editar usuario existente
- [ ] Eliminar personal (verificar cascada)
- [ ] Eliminar conductor
- [ ] Eliminar usuario

### 5.2 Validaciones

- [ ] CI único en personal
- [ ] Email único en personal
- [ ] Nro_licencia único en conductores
- [ ] Experiencia_anios >= 0
- [ ] Fecha de vencimiento de licencia válida
- [ ] Contraseñas coinciden en registro
- [ ] Email válido en todos los formularios

### 5.3 Autocompletado

- [ ] Seleccionar personal autocompleta datos de usuario
- [ ] Seleccionar conductor autocompleta datos de usuario
- [ ] Datos autocompletados son editables
- [ ] Lista de personal disponible no incluye ya vinculados
- [ ] Lista de conductores disponibles no incluye ya vinculados

### 5.4 Permisos

- [ ] Solo admin puede crear usuarios
- [ ] Solo admin puede editar usuarios
- [ ] Solo admin puede eliminar usuarios
- [ ] Staff puede leer personal/conductores
- [ ] Solo admin puede escribir personal/conductores
- [ ] Usuarios sin is_admin_portal no acceden a panel admin

### 5.5 Registro Público

- [ ] Registro público crea rol 'Cliente'
- [ ] Registro público establece is_admin_portal=False
- [ ] Registro público requiere verificación de email
- [ ] Login admin no muestra opción de registro
- [ ] Login cliente muestra opción de registro

### 5.6 Frontend

- [ ] Formularios validan campos obligatorios
- [ ] Tablas muestran datos correctamente
- [ ] Búsqueda funciona en todas las tablas
- [ ] Paginación funciona correctamente
- [ ] Modales se abren y cierran correctamente
- [ ] Toasts muestran mensajes de éxito/error
- [ ] Navegación entre páginas funciona
- [ ] Responsive design funciona en móviles

### 5.7 Integración

- [ ] Docker compose levanta todos los servicios
- [ ] Migraciones se ejecutan correctamente
- [ ] Seeders crean datos iniciales
- [ ] API responde en todos los endpoints
- [ ] Frontend se conecta correctamente al backend
- [ ] Email funciona con MailHog
- [ ] Base de datos persiste datos entre reinicios
