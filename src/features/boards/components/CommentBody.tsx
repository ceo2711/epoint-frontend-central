import type { CommentBodyPart } from "@/features/boards/utils/commentMentions";
import { parseCommentBody } from "@/features/boards/utils/commentMentions";

interface CommentBodyProps {
  body: string;
}

function renderPart(part: CommentBodyPart, index: number) {
  if (part.type === "mention") {
    return (
      <span
        key={`mention-${index}`}
        className="rounded bg-blue-100 px-1 font-medium text-blue-700"
        title={`@${part.name}`}
      >
        @{part.name}
      </span>
    );
  }
  return <span key={`text-${index}`}>{part.value}</span>;
}

function renderFallbackBody(body: string) {
  return body.split(/(@\[[^\]]+\]\(mention:\d+\))/g).map((chunk, index) => {
    const match = chunk.match(/^@\[([^\]]+)\]\(mention:\d+\)$/);
    if (match) {
      return (
        <span
          key={`mention-fallback-${index}`}
          className="rounded bg-blue-100 px-1 font-medium text-blue-700"
          title={`@${match[1]}`}
        >
          @{match[1]}
        </span>
      );
    }
    return <span key={`text-fallback-${index}`}>{chunk}</span>;
  });
}

export function CommentBody({ body }: CommentBodyProps) {
  const parts = parseCommentBody(body);
  const hasMentions = parts.some((part) => part.type === "mention");

  if (!hasMentions && body.includes("(mention:")) {
    return (
      <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
        {renderFallbackBody(body)}
      </p>
    );
  }

  return (
    <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
      {parts.map(renderPart)}
    </p>
  );
}
