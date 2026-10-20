import type {BoardMember, BoardRole} from "@/entities/board"
import {Avatar} from "@/shared/components/avatar/Avatar.tsx"
import {usePopover} from "@/shared/lib/usePopover.ts"
import {useBoardMembers} from "../../utils/useBoardMembers.ts"
import {useTranslation} from "react-i18next"
import clsx from "clsx"
import boardMembersStyles from './boardMembers.module.sass'


const STACK_LIMIT = 4

interface BoardMembersProps {
  boardId: string
  members: BoardMember[]
  role: BoardRole
}

export function BoardMembers({ boardId, members, role }: BoardMembersProps) {
  const { t } = useTranslation()
  const { isOpen, toggle, containerRef, popoverRef } = usePopover()
  const {
    meId,
    username,
    errorKey,
    isAdding,
    handleUsernameChange,
    handleInvite,
    handleRemove,
    handleLeave,
  } = useBoardMembers(boardId)

  const isOwner = role === 'owner'
  const stack = members.slice(0, STACK_LIMIT)
  const rest = members.length - stack.length

  return (
    <div className={boardMembersStyles.container} ref={containerRef}>
      <button
        className={boardMembersStyles.trigger}
        onClick={toggle}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <span className={boardMembersStyles.stack}>
          {stack.map(member => (
            <Avatar
              key={member.id}
              id={member.id}
              name={member.displayName}
              size="sm"
              className={boardMembersStyles.stackItem}
            />
          ))}
          {rest > 0 && <span className={clsx(boardMembersStyles.stackItem, boardMembersStyles.stackRest)}>+{rest}</span>}
        </span>
        <span className={boardMembersStyles.triggerLabel}>
          {isOwner ? (
            <>
              <svg width="8" height="8" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
                <path d="M6 1v10M1 6h10"/>
              </svg>
              {t('members.share')}
            </>
          ) : t('members.title')}
        </span>
      </button>

      {isOpen && (
        <div className={boardMembersStyles.popover} ref={popoverRef} role="dialog" aria-label={t('members.title')}>
          <div className={boardMembersStyles.header}>
            <span className={boardMembersStyles.title}>{t('members.title')}</span>
            <span className={boardMembersStyles.count}>{members.length}</span>
          </div>

          <ul className={boardMembersStyles.list}>
            {members.map(member => {
              const isMe = member.id === meId

              return (
                <li key={member.id} className={boardMembersStyles.item}>
                  <Avatar id={member.id} name={member.displayName} />
                  <div className={boardMembersStyles.info}>
                    <span className={boardMembersStyles.name}>
                      {member.displayName}
                      {isMe && <span className={boardMembersStyles.you}>{t('members.you')}</span>}
                    </span>
                    <span className={boardMembersStyles.username}>@{member.username}</span>
                  </div>

                  {member.role === 'owner' ? (
                    <span className={boardMembersStyles.badge}>{t('members.owner')}</span>
                  ) : isOwner ? (
                    <button
                      className={boardMembersStyles.remove}
                      onClick={() => handleRemove(member.id)}
                      aria-label={t('members.remove')}
                      title={t('members.remove')}
                    >
                      <svg width="8" height="8" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                        <path d="M1 1l10 10M11 1L1 11" />
                      </svg>
                    </button>
                  ) : isMe ? (
                    <button className={boardMembersStyles.leave} onClick={handleLeave}>
                      {t('members.leave')}
                    </button>
                  ) : null}
                </li>
              )
            })}
          </ul>

          {isOwner && (
            <form className={boardMembersStyles.invite} onSubmit={handleInvite}>
              <div className={boardMembersStyles.inviteRow}>
                <input
                  className={boardMembersStyles.input}
                  value={username}
                  onChange={e => handleUsernameChange(e.target.value)}
                  placeholder={t('members.invite-placeholder')}
                  autoComplete="off"
                  autoFocus
                />
                <button
                  className={boardMembersStyles.inviteBtn}
                  type="submit"
                  disabled={!username.trim() || isAdding}
                >
                  {t('members.invite')}
                </button>
              </div>
              {errorKey
                ? <p className={boardMembersStyles.error}>{t(errorKey)}</p>
                : <p className={boardMembersStyles.hint}>{t('members.invite-hint')}</p>}
            </form>
          )}
        </div>
      )}
    </div>
  )
}
