export interface MentionableUser {
  id: number;
  full_name: string;
  role_code: string;
}

export const MENTION_TOKEN_REGEX = /@\[([^\]]+)\]\(mention:(\d+)\)/g;

export function formatMentionToken(user: Pick<MentionableUser, "id" | "full_name">) {
  return `@[${user.full_name}](mention:${user.id})`;
}

export function formatMentionPlain(user: Pick<MentionableUser, "full_name">) {
  return `@${user.full_name}`;
}

export function excludeSelfMentionableUsers(
  users: MentionableUser[],
  currentUserId?: number | null,
) {
  if (currentUserId == null) return users;
  return users.filter((user) => user.id !== currentUserId);
}

export function encodeMentionsInBody(
  body: string,
  users: MentionableUser[],
  excludeUserId?: number | null,
) {
  if (!body.trim() || users.length === 0) return body;

  let result = body;
  const sorted = [...users]
    .filter((user) => excludeUserId == null || user.id !== excludeUserId)
    .sort((a, b) => b.full_name.length - a.full_name.length);
  for (const user of sorted) {
    const token = formatMentionToken(user);
    const plain = formatMentionPlain(user);
    result = result.replaceAll(token, plain).replaceAll(plain, token);
  }
  return result;
}

export function decodeMentionsForDisplay(body: string) {
  return body.replace(/@\[([^\]]+)\]\(mention:\d+\)/g, "@$1");
}

export type CommentBodyPart =
  | { type: "text"; value: string }
  | { type: "mention"; name: string; userId: number };

export function parseCommentBody(body: string): CommentBodyPart[] {
  const parts: CommentBodyPart[] = [];
  let lastIndex = 0;
  const regex = /@\[([^\]]+)\]\(mention:(\d+)\)/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(body)) !== null) {
    const index = match.index;
    if (index > lastIndex) {
      parts.push({ type: "text", value: body.slice(lastIndex, index) });
    }
    parts.push({
      type: "mention",
      name: match[1],
      userId: Number(match[2]),
    });
    lastIndex = index + match[0].length;
  }

  if (lastIndex < body.length) {
    parts.push({ type: "text", value: body.slice(lastIndex) });
  }

  return parts.length > 0 ? parts : [{ type: "text", value: body }];
}

export function getActiveMentionQuery(value: string, cursor: number) {
  const before = value.slice(0, cursor);
  const atIndex = before.lastIndexOf("@");
  if (atIndex === -1) return null;

  const query = before.slice(atIndex + 1);
  if (query.includes(" ") || query.includes("\n") || query.includes("[")) return null;

  return { start: atIndex, query };
}

export function filterMentionableUsers(users: MentionableUser[], query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return users;
  return users.filter((user) => user.full_name.toLowerCase().includes(normalized));
}

export function insertMentionPlain(value: string, start: number, cursor: number, fullName: string) {
  return `${value.slice(0, start)}@${fullName} ${value.slice(cursor)}`;
}
