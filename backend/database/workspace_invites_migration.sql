-- Run this on existing databases to enable invite-token flow
CREATE TABLE IF NOT EXISTS workspace_invites (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    inviter_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    accepted_by     UUID REFERENCES users(id) ON DELETE SET NULL,
    invitee_email   VARCHAR(255) NOT NULL,
    role            VARCHAR(20) NOT NULL DEFAULT 'member'
                        CHECK (role IN ('admin', 'member', 'viewer')),
    token           VARCHAR(255) NOT NULL UNIQUE,
    status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
    invited_at      TIMESTAMPTZ DEFAULT NOW(),
    expires_at      TIMESTAMPTZ NOT NULL,
    accepted_at     TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_workspace_invites_workspace_email
ON workspace_invites(workspace_id, invitee_email);

CREATE INDEX IF NOT EXISTS idx_workspace_invites_lookup
ON workspace_invites(token, status, expires_at);
