"use client";

import { TaskStatusBadge } from "@/components/ui/Badge";
import type { Board, BoardCard } from "@/features/boards/types";

interface TaskBoardProps {
  board: Board;
  onSelectCard: (card: BoardCard) => void;
}

export function TaskBoard({ board, onSelectCard }: TaskBoardProps) {
  return (
    <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4">
      {board.lists.map((list) => (
        <div key={list.id} className="kanban-column w-[min(18rem,80vw)] shrink-0 snap-start p-3 sm:w-80">
          <h3 className="mb-3 px-1 text-sm font-bold uppercase tracking-wider text-slate-500">
            {list.title}
          </h3>
          <div className="space-y-2">
            {list.cards.map((card) => (
              <button
                key={card.id}
                type="button"
                onClick={() => onSelectCard(card)}
                className="kanban-card w-full text-left"
              >
                <p className="text-sm font-semibold text-slate-800">{card.title}</p>
                <span className="mt-2 inline-block">
                  <TaskStatusBadge status={card.status} />
                </span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
