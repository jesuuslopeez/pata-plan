import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronLeft, GripVertical, Pencil, Plus, Trash } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { usePageTitle } from '../../hooks/usePageTitle';
import {
  createProtocol,
  getEventTypes,
  getProtocol,
  updateProtocol,
} from '../../services/protocol.service';
import { Badge } from '../../components/Badge/Badge';
import { ProtocolStepModal } from '../../components/ProtocolStepModal/ProtocolStepModal';
import { ConfirmDialog } from '../../components/ConfirmDialog/ConfirmDialog';
import { translateEventType } from '../../utils/eventTypeLabels';
import './ProtocolEditor.scss';

const CATEGORY_LABEL = {
  VACCINE: 'Vacuna',
  DEWORMING_INTERNAL: 'Desp. interna',
  DEWORMING_EXTERNAL: 'Desp. externa',
  TREATMENT: 'Tratamiento',
  CHECKUP: 'Revisión',
};
const CATEGORY_VARIANT = {
  VACCINE: 'info',
  DEWORMING_INTERNAL: 'warning',
  DEWORMING_EXTERNAL: 'warning',
  TREATMENT: 'danger',
  CHECKUP: 'neutral',
};

let localStepCounter = 0;
const nextLocalKey = () => `local-${++localStepCounter}-${Date.now()}`;

export function ProtocolEditor() {
  usePageTitle('Editor de protocolo');
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const isNew = !id;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState([]);
  const [eventTypes, setEventTypes] = useState([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingKey, setEditingKey] = useState(null);
  const [deletingKey, setDeletingKey] = useState(null);

  useEffect(() => {
    getEventTypes()
      .then((res) => setEventTypes(res.data?.eventTypes || []))
      .catch(() => setEventTypes([]));
  }, []);

  useEffect(() => {
    if (isNew) return;
    setLoading(true);
    getProtocol(id)
      .then((res) => {
        const protocol = res.data?.protocol || res.data;
        setName(protocol?.name || '');
        setDescription(protocol?.description || '');
        setSteps(
          (protocol?.steps || []).map((s) => ({
            key: `srv-${s.id}`,
            eventTypeId: s.eventTypeId ?? s.eventType?.id,
            eventType: s.eventType,
            dayOffset: s.dayOffset,
            product: s.product,
            notes: s.notes,
          }))
        );
      })
      .catch(() => setError('No se ha podido cargar el protocolo'))
      .finally(() => setLoading(false));
  }, [id, isNew]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const sortedSteps = useMemo(
    () => [...steps].sort((a, b) => a.dayOffset - b.dayOffset),
    [steps]
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setSteps((prev) => {
      const oldIndex = prev.findIndex((s) => s.key === active.id);
      const newIndex = prev.findIndex((s) => s.key === over.id);
      if (oldIndex === -1 || newIndex === -1) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  const handleAddStep = (data) => {
    const eventType =
      data.eventType || eventTypes.find((et) => et.id === data.eventTypeId);
    const { eventType: _omit, ...stepData } = data;
    if (editingKey) {
      setSteps((prev) =>
        prev.map((s) =>
          s.key === editingKey ? { ...s, ...stepData, eventType } : s
        )
      );
    } else {
      setSteps((prev) => [
        ...prev,
        { key: nextLocalKey(), ...stepData, eventType },
      ]);
    }
    setModalOpen(false);
    setEditingKey(null);
  };

  const handleEditStep = (key) => {
    setEditingKey(key);
    setModalOpen(true);
  };

  const handleRemoveStep = (key) => {
    setDeletingKey(key);
  };

  const confirmRemoveStep = () => {
    setSteps((prev) => prev.filter((s) => s.key !== deletingKey));
    setDeletingKey(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('El nombre es obligatorio');
      return;
    }
    setSaving(true);
    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      steps: steps.map((s) => ({
        eventTypeId: s.eventTypeId,
        dayOffset: s.dayOffset,
        product: s.product || null,
        notes: s.notes || null,
      })),
    };
    try {
      if (isNew) {
        await createProtocol(payload);
      } else {
        await updateProtocol(id, payload);
      }
      navigate('/protocols');
    } catch (err) {
      setError(err?.response?.data?.error || 'No se ha podido guardar el protocolo');
    } finally {
      setSaving(false);
    }
  };

  const editingStep = editingKey
    ? steps.find((s) => s.key === editingKey)
    : null;

  if (loading) {
    return <div className="protocol-editor__loading" role="status" aria-live="polite">Cargando…</div>;
  }

  const readOnly = !isAdmin;

  return (
    <div className="protocol-editor">
      <button
        type="button"
        className="protocol-editor__back"
        onClick={() => navigate('/protocols')}
      >
        <ChevronLeft size={16} aria-hidden="true" />
        <span>Volver a protocolos</span>
      </button>

      <header className="protocol-editor__header">
        <h1 className="protocol-editor__title">
          {isNew ? 'Nuevo protocolo' : readOnly ? 'Detalle de protocolo' : 'Editar protocolo'}
        </h1>
        {!readOnly && (
          <button
            type="submit"
            form="protocol-form"
            className="protocol-editor__save"
            disabled={saving}
          >
            {saving ? 'Guardando…' : 'Guardar protocolo'}
          </button>
        )}
      </header>

      <form id="protocol-form" className="protocol-editor__form" onSubmit={handleSave}>
        <div className="protocol-editor__field">
          <label className="protocol-editor__label" htmlFor="protocol-name">
            Nombre
          </label>
          <input
            id="protocol-name"
            type="text"
            className="protocol-editor__input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={readOnly}
            maxLength={100}
            placeholder="p. ej. Nuevo gato en refugio"
            required
          />
        </div>

        <div className="protocol-editor__field">
          <label className="protocol-editor__label" htmlFor="protocol-desc">
            Descripción
          </label>
          <textarea
            id="protocol-desc"
            className="protocol-editor__input protocol-editor__input--textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={readOnly}
            rows={3}
            placeholder="Para qué sirve este protocolo, en qué animales se aplica…"
          />
        </div>

        {error && <p className="protocol-editor__error" role="alert">{error}</p>}
      </form>

      <section className="protocol-editor__timeline">
        <div className="protocol-editor__timeline-head">
          <h2 className="protocol-editor__section-title">Pasos del protocolo</h2>
          {!readOnly && (
            <button
              type="button"
              className="protocol-editor__add-step"
              onClick={() => {
                setEditingKey(null);
                setModalOpen(true);
              }}
            >
              <Plus size={16} aria-hidden="true" />
              <span>Añadir paso</span>
            </button>
          )}
        </div>

        {steps.length === 0 ? (
          <p className="protocol-editor__empty">
            Aún no hay pasos. Añade el primero para construir el protocolo.
          </p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={steps.map((s) => s.key)}
              strategy={verticalListSortingStrategy}
            >
              <ol className="protocol-editor__steps">
                {steps.map((step, index) => (
                  <SortableStep
                    key={step.key}
                    step={step}
                    index={index}
                    readOnly={readOnly}
                    onEdit={() => handleEditStep(step.key)}
                    onRemove={() => handleRemoveStep(step.key)}
                  />
                ))}
              </ol>
            </SortableContext>
          </DndContext>
        )}

        {steps.length > 1 && !readOnly && (
          <p className="protocol-editor__hint">
            Arrastra los pasos por la manilla izquierda para cambiar su orden de aplicación.
          </p>
        )}

        {sortedSteps.length > 0 && (
          <p className="protocol-editor__hint">
            Línea de tiempo aplicada al asignar:{' '}
            {sortedSteps.map((s, i) => (
              <span key={s.key} className="protocol-editor__chrono">
                Día {s.dayOffset}{i < sortedSteps.length - 1 ? ' → ' : ''}
              </span>
            ))}
          </p>
        )}
      </section>

      {modalOpen && (
        <ProtocolStepModal
          key={editingKey || 'new'}
          initial={editingStep}
          eventTypes={eventTypes}
          onClose={() => {
            setModalOpen(false);
            setEditingKey(null);
          }}
          onSubmit={handleAddStep}
        />
      )}

      <ConfirmDialog
        open={!!deletingKey}
        title="Eliminar paso"
        message="¿Eliminar este paso del protocolo?"
        confirmText="Eliminar"
        danger
        onClose={() => setDeletingKey(null)}
        onConfirm={confirmRemoveStep}
      />
    </div>
  );
}

function SortableStep({ step, index, readOnly, onEdit, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: step.key,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  const category = step.eventType?.category;

  return (
    <li ref={setNodeRef} style={style} className="protocol-step">
      <div className="protocol-step__rail">
        <div className="protocol-step__dot" />
        <div className="protocol-step__line" />
      </div>

      {!readOnly && (
        <button
          type="button"
          className="protocol-step__handle"
          aria-label="Arrastrar para reordenar"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={16} aria-hidden="true" />
        </button>
      )}

      <div className="protocol-step__body">
        <div className="protocol-step__head">
          <span className="protocol-step__day">Día {step.dayOffset}</span>
          <span className="protocol-step__order">Paso {index + 1}</span>
          {category && (
            <Badge
              text={CATEGORY_LABEL[category] || category}
              variant={CATEGORY_VARIANT[category] || 'neutral'}
            />
          )}
        </div>
        <p className="protocol-step__name">{step.eventType?.name ? translateEventType(step.eventType.name) : 'Evento sin tipo'}</p>
        {step.product && <p className="protocol-step__meta">Producto: {step.product}</p>}
        {step.notes && <p className="protocol-step__notes">{step.notes}</p>}
      </div>

      {!readOnly && (
        <div className="protocol-step__actions">
          <button
            type="button"
            className="protocol-step__icon-btn"
            onClick={onEdit}
            aria-label="Editar paso"
          >
            <Pencil size={14} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="protocol-step__icon-btn protocol-step__icon-btn--danger"
            onClick={onRemove}
            aria-label="Eliminar paso"
          >
            <Trash size={14} aria-hidden="true" />
          </button>
        </div>
      )}
    </li>
  );
}
