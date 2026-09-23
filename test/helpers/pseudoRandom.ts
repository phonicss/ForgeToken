export function pseudoRandom(
    seed: bigint
): bigint {
    return (
        seed * 1103515245n + 12345n
    ) % 2147483648n;
}