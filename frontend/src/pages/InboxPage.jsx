import { openInviteModal } from '../utils/inviteModal';

export default function InboxPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="bg-white rounded-xl border border-gray-200 px-8 py-10 text-center shadow-sm max-w-lg w-full">
        <h1 className="text-2xl font-semibold text-gray-900 mb-3">Inbox</h1>
        <p className="text-gray-600 text-base mb-6">
          Bring teammates into this workspace so you can assign work, comment in context, and stay in
          sync—invite people anytime from here.
        </p>
        <button
          type="button"
          onClick={openInviteModal}
          className="inline-flex items-center justify-center rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white hover:bg-violet-700 transition-colors"
        >
          Collaborate with people
        </button>
      </div>
    </div>
  );
}
