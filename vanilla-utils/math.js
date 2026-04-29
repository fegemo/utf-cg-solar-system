export function interpolateMatrices(m1, m2, t) {
    return m1.map((v1, c) => {
        const v2 = m2[c]
        return (1-t)*v1 + t*v2
    })
}
