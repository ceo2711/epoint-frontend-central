"use client";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { type FormEvent, useEffect, useMemo, useState } from "react";

import { useTranslation } from "@/contexts/LanguageContext";
import { CardLabelBadge, CardLabelPicker } from "@/features/boards/components/CardLabelBadge";
import {
  DEFAULT_BOARD_CARD_LABEL,
  kanbanCardLabelClass,
  type BoardCardLabel,
} from "@/features/boards/constants/cardLabels";
import type { Board, BoardCard, BoardList } from "@/features/boards/types";

interface TaskBoardProps {
  board: Board;
  onSelectCard: (card: BoardCard) => void;
  onMoveCard?: (cardId: number, listId: number, position: number) => Promise<void>;
  onCreateCard?: (listId: number, title: string, position?: number) => Promise<BoardCard>;
  onUpdateLabel?: (cardId: number, label: BoardCardLabel) => Promise<void>;
  canDrag?: boolean;
  canCreateCards?: boolean;
  canSetLabel?: boolean;
}

function listContainerId(listId: number) {
  return `list-${listId}`;
}

function parseListContainerId(id: string | number): number | null {
  if (typeof id === "string" && id.startsWith("list-")) {
    return Number(id.replace("list-", ""));
  }
  return null;
}

function findListForCard(board: Board, cardId: number): BoardList | undefined {
  return board.lists.find((list) => list.cards.some((card) => card.id === cardId));
}

function SortableKanbanCard({
  card,
  onSelect,
  canDrag,
  canSetLabel,
  onUpdateLabel,
}: {
  card: BoardCard;
  onSelect: () => void;
  canDrag: boolean;
  canSetLabel: boolean;
  onUpdateLabel?: (cardId: number, label: BoardCardLabel) => Promise<void>;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    disabled: !canDrag,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="touch-manipulation">
      <div
        className={`kanban-card w-full text-left ${kanbanCardLabelClass(card.label)} ${canDrag ? "cursor-grab active:cursor-grabbing" : ""}`}
        {...(canDrag ? { ...attributes, ...listeners } : {})}
      >
        <div className="flex items-start gap-1">
          <button type="button" className="min-w-0 flex-1 text-left" onClick={onSelect}>
            <p className="text-xs font-semibold leading-snug text-slate-800">{card.title}</p>
            <div className="mt-1.5">
              <CardLabelBadge label={card.label} />
            </div>
          </button>
          {canSetLabel && onUpdateLabel ? (
            <CardLabelPicker
              compact
              value={card.label}
              onChange={(label) => {
                void onUpdateLabel(card.id, label);
              }}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function KanbanColumn({
  list,
  onSelectCard,
  canDrag,
  onCreateCard,
  canCreateCards,
  canSetLabel,
  onUpdateLabel,
}: {
  list: BoardList;
  onSelectCard: (card: BoardCard) => void;
  canDrag: boolean;
  onCreateCard?: (listId: number, title: string, position?: number) => Promise<BoardCard>;
  canCreateCards: boolean;
  canSetLabel: boolean;
  onUpdateLabel?: (cardId: number, label: BoardCardLabel) => Promise<void>;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: listContainerId(list.id) });

  return (
    <div className="kanban-column group/column flex w-[11.5rem] shrink-0 snap-start flex-col p-2 sm:w-48">
      <div className="kanban-column-header shrink-0">
        <span>{list.title}</span>
        <span className="kanban-column-count">{list.cards.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={`kanban-column-body space-y-1.5 rounded-lg p-0.5 transition ${
          isOver ? "bg-blue-100/70 ring-2 ring-blue-300" : ""
        }`}
      >
        <SortableContext items={list.cards.map((card) => card.id)} strategy={verticalListSortingStrategy}>
          {list.cards.map((card) => (
            <SortableKanbanCard
              key={card.id}
              card={card}
              canDrag={canDrag}
              canSetLabel={canSetLabel}
              onUpdateLabel={onUpdateLabel}
              onSelect={() => onSelectCard(card)}
            />
          ))}
        </SortableContext>
        {canCreateCards && onCreateCard && (
          <AddCardForm listId={list.id} cardCount={list.cards.length} onCreate={onCreateCard} />
        )}
      </div>
    </div>
  );
}

function AddCardForm({
  listId,
  cardCount,
  onCreate,
}: {
  listId: number;
  cardCount: number;
  onCreate: (listId: number, title: string, position?: number) => Promise<BoardCard>;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      await onCreate(listId, trimmed, cardCount);
      setTitle("");
      setOpen(false);
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("portalBoard.addCard")}
        className="flex w-full items-center gap-1 rounded-md px-1 py-1 text-left text-[11px] text-slate-600 opacity-0 transition hover:bg-blue-50 hover:text-blue-800 group-hover/column:opacity-100 focus-visible:opacity-100"
      >
        <span className="text-sm leading-none text-slate-400">+</span>
        <span>{t("portalBoard.addCard")}</span>
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-0.5 space-y-1.5 rounded-lg border border-slate-200/80 bg-white p-1.5 shadow-sm">
      <input
        autoFocus
        className="input-field px-2 py-1.5 text-xs"
        placeholder={t("portalBoard.cardTitlePlaceholder")}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        disabled={saving}
      />
      <div className="flex flex-wrap gap-1">
        <button type="submit" className="btn btn-primary btn-sm px-2 py-1 text-xs" disabled={saving || !title.trim()}>
          {saving ? t("common.loading") : t("portalBoard.createCard")}
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          disabled={saving}
          onClick={() => {
            setOpen(false);
            setTitle("");
          }}
        >
          {t("common.cancel")}
        </button>
      </div>
    </form>
  );
}

function KanbanCardPreview({ card }: { card: BoardCard }) {
  return (
    <div className={`kanban-card w-48 rotate-1 shadow-lg ${kanbanCardLabelClass(card.label)}`}>
      <p className="text-xs font-semibold leading-snug text-slate-800">{card.title}</p>
      <div className="mt-1.5">
        <CardLabelBadge label={card.label} />
      </div>
    </div>
  );
}

export function TaskBoard({
  board,
  onSelectCard,
  onMoveCard,
  onCreateCard,
  onUpdateLabel,
  canDrag = true,
  canCreateCards = true,
  canSetLabel = false,
}: TaskBoardProps) {
  const [activeCard, setActiveCard] = useState<BoardCard | null>(null);
  const [localBoard, setLocalBoard] = useState(board);

  useEffect(() => {
    setLocalBoard(board);
  }, [board]);

  const sensors = useSensors(
    // MouseSensor no aplica touch-action:none, así el scroll con rueda/trackpad
    // sigue funcionando al pasar el mouse por las cards.
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const cardsById = useMemo(() => {
    const map = new Map<number, BoardCard>();
    for (const list of localBoard.lists) {
      for (const card of list.cards) {
        map.set(card.id, card);
      }
    }
    return map;
  }, [localBoard]);

  function resolveTargetListId(overId: string | number): number | null {
    const listId = parseListContainerId(overId);
    if (listId) return listId;
    const card = cardsById.get(Number(overId));
    if (!card) return null;
    return findListForCard(localBoard, card.id)?.id ?? null;
  }

  function resolveTargetPosition(listId: number, overId: string | number, activeId: number): number {
    const list = localBoard.lists.find((item) => item.id === listId);
    if (!list) return 0;
    if (parseListContainerId(overId) !== null) return list.cards.filter((card) => card.id !== activeId).length;
    const overIndex = list.cards.findIndex((card) => card.id === Number(overId));
    return overIndex >= 0 ? overIndex : list.cards.length;
  }

  function applyLocalMove(cardId: number, listId: number, position: number): Board {
    const nextLists = localBoard.lists.map((list) => ({
      ...list,
      cards: [...list.cards],
    }));

    let movingCard: BoardCard | undefined;
    for (const list of nextLists) {
      const index = list.cards.findIndex((card) => card.id === cardId);
      if (index >= 0) {
        movingCard = list.cards.splice(index, 1)[0];
        break;
      }
    }
    if (!movingCard) return localBoard;

    const targetList = nextLists.find((list) => list.id === listId);
    if (!targetList) return localBoard;

    const insertAt = Math.max(0, Math.min(position, targetList.cards.length));
    targetList.cards.splice(insertAt, 0, movingCard);
    nextLists.forEach((list) => {
      list.cards = list.cards.map((card, index) => ({ ...card, position: index }));
    });

    return { ...localBoard, lists: nextLists };
  }

  function applyLocalCreate(listId: number, card: BoardCard, position?: number): Board {
    const nextLists = localBoard.lists.map((list) => ({
      ...list,
      cards: [...list.cards],
    }));
    const targetList = nextLists.find((list) => list.id === listId);
    if (!targetList) return localBoard;

    const insertAt =
      position === undefined ? targetList.cards.length : Math.max(0, Math.min(position, targetList.cards.length));
    targetList.cards.splice(insertAt, 0, card);
    nextLists.forEach((list) => {
      list.cards = list.cards.map((item, index) => ({ ...item, position: index }));
    });

    return { ...localBoard, lists: nextLists };
  }

  function replaceCardInBoard(current: Board, tempId: number, created: BoardCard): Board {
    return {
      ...current,
      lists: current.lists.map((list) => ({
        ...list,
        cards: list.cards.map((card) => (card.id === tempId ? created : card)),
      })),
    };
  }

  function buildPlaceholderCard(title: string, position: number): BoardCard {
    return {
      id: -Date.now(),
      title,
      description_md: null,
      instructions_md: null,
      external_links: null,
      status: "PENDIENTE",
      label: DEFAULT_BOARD_CARD_LABEL,
      position,
      requires_credentials: false,
      requires_file_upload: false,
      client_result_text: null,
      comments: [],
      attachments: [],
      has_credentials: false,
    };
  }

  async function handleCreateCard(listId: number, title: string, position?: number) {
    if (!onCreateCard) throw new Error("onCreateCard not configured");

    const targetList = localBoard.lists.find((list) => list.id === listId);
    const insertAt = position ?? targetList?.cards.length ?? 0;
    const placeholder = buildPlaceholderCard(title, insertAt);
    const snapshot = localBoard;

    setLocalBoard(applyLocalCreate(listId, placeholder, position));

    try {
      const created = await onCreateCard(listId, title, position);
      setLocalBoard((prev) => replaceCardInBoard(prev, placeholder.id, created));
      return created;
    } catch {
      setLocalBoard(snapshot);
      throw new Error("create failed");
    }
  }

  function handleDragStart(event: DragStartEvent) {
    const card = cardsById.get(Number(event.active.id));
    setActiveCard(card ?? null);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveCard(null);
    if (!over || !onMoveCard || !canDrag) return;

    const cardId = Number(active.id);
    const targetListId = resolveTargetListId(over.id);
    if (!targetListId) return;

    const sourceList = findListForCard(localBoard, cardId);
    const targetPosition = resolveTargetPosition(targetListId, over.id, cardId);
    if (!sourceList) return;
    if (sourceList.id === targetListId && sourceList.cards.findIndex((card) => card.id === cardId) === targetPosition) {
      return;
    }

    const snapshot = localBoard;
    const optimistic = applyLocalMove(cardId, targetListId, targetPosition);
    setLocalBoard(optimistic);

    try {
      await onMoveCard(cardId, targetListId, targetPosition);
    } catch {
      setLocalBoard(snapshot);
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex w-full min-w-0 max-w-full items-start snap-x snap-mandatory gap-2 overflow-x-auto pb-4">
        {localBoard.lists
          .slice()
          .sort((a, b) => a.position - b.position)
          .map((list) => (
            <KanbanColumn
              key={list.id}
              list={list}
              onSelectCard={onSelectCard}
              canDrag={canDrag && !!onMoveCard}
              onCreateCard={handleCreateCard}
              canCreateCards={canCreateCards && !!onCreateCard}
              canSetLabel={canSetLabel && !!onUpdateLabel}
              onUpdateLabel={onUpdateLabel}
            />
          ))}
      </div>
      <DragOverlay>{activeCard ? <KanbanCardPreview card={activeCard} /> : null}</DragOverlay>
    </DndContext>
  );
}
