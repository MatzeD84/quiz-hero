export function isAvatarAvailable(avatar, user) {
    return !avatar.unlockRule || (Array.isArray(user?.unlockedAvatarKeys) && user.unlockedAvatarKeys.includes(avatar.key));
}
