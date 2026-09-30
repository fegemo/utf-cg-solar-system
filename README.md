# Sistema Solar

Vamos criar um sistema solar para exercitar a modelagem hierárquica. A ideia
é que existe uma hierarquia de transformações em que os elementos filhos
estão sob efeito da transformação do pai, +suas próprias transformações.

No nosso caso, temos:
1. Sol
   1. Mercúrio
   1. Vênus
   1. Terra
      1. Lua
   1. Marte

Para exemplificar, a Lua tem sua própria órbita ao redor da Terra, portanto,
a Lua se movimenta (ou seja, tem suas transformações) mas também está sob efeito 
da movimentação da Terra em sua órbita pelo Sol.

Mas como fazer para que um elemento esteja sob efeito das transformações do seu
"pai", além das próprias? Usando **composição de transformações**, ou seja,
multiplicando a matriz de transformação do filho (à direita) pela matriz do pai
(esquerda).

Há pelo menos duas abordagens:
1. Usar uma pilha de matrizes `model`
1. Usar um grafo de cena

Vejamos brevemente cada uma.


## Abordagem 1: Pilha de Matrizes Model

Em vez de cada objeto ter sua própria matriz `model` que registra as suas 
transformações, podemos trabalhar com uma **pilha de matrizes de modelo**.
Inclusive, era assim que trabalhávamos no OpenGL de pipeline fixo (antiguinho).
A ideia é que sempre que desenhamos um objeto, usamos a matriz modelo que está
atualmente no topo da pilha de matrizes `model`.

Criamos uma cópia da matriz (`model.push(model.at(-1))` que está no topo 
quando queremos modificá-la para desenhar um novo objeto (eg, Mercúrio), 
mas sabemos que vamos precisar retornar ao sistema de coordenadas anterior
(eg, Sol) para desenhar outros objetos (eg, os próximos planetas).

E a matriz de um objeto, que é filho de outro, será dada pela multiplicação
da matriz do pai A pela matriz do próprio objeto B, `A x B`.


## Abordagem 2: Grafo de Cena

Em situações mais complexas, é interessante representar os objetos da cena
usando a estrutura de grafo de cena. Cada nó possui uma transformação associada.

Para desenhar um objeto, devemos percorrer a hierarquia e pré-multiplicar
a transformação do objeto atual pela transformação do pai. Por exemplo:

```
Queremos desenhar Child: [Root] → [Parent] → [Child]
Resultado: resultingTransform = root.transform * parent.transform * child.transform
```

## Exercício

Você deve abrir o projeto e fazer a atividade no arquivo `main.vanilla.js`.
Até visualize os outros arquivos, mas o principal está nesse `main`.

Recomendo usar a abordagem 1 (pilha de matrizes model) porque o código está
prontinho para isso, e é mais simples de implementar do que um grafo de cena.

ℹ️ Observação: estamos usando o utilitário matemático da
TWGL.js. Em particular, para matrizes 4x4 ([m4][m4-docs]) e
para ponto/vetor de 3 dimensões ([v3][v3-docs]).

Vamos lá:

- Exercício 0: Cor de Fundo
    - Sistema solar branco? Nada disso. Procure o que está tornando 
        ele branco e **modifique para preto**. A ideia é se familiarizar com o
        arquivo.
- Exercício 1: Mercúrio
    - Implemente as transformações para desenhar Mercúrio
    - Todos os planetas são esferas, desenhadas com:
        ```javascript
        state.geometry.sphere.draw(gl, state.wireframe)
        ```
        - Parâmetros: `gl` é o contexto do WebGL e `state.wireframe`
          é apenas um `boolean` para indicar se as arestas devem ser
          desenhadas também (não se preocupe com esses parâmetros)
    - Repare como desenhamos o Sol:
        ```javascript
        // cria a pilha de matrizes model
        let model = []
        // coloca uma identidade pra ficar sempre no fundo
        model.push(m4.identity())
            // leva o sistema de coordenadas para a posição do sol na cena
            // como é o sistema solar, coloquei o sol em [0,0,0]...
            // mas se fosse a galáxia, [0,0,0] seria o centro da Via Láctea
            model.push(m4.translate(model.at(-1), [0, 0, 0]))
                // faz o Sol girar em torno de si
                model.push(m4.rotateY(model.at(-1), sun.rotationAngle))
                    model[model.length - 1] = m4.scale(model.at(-1), [sun.radius, sun.radius, sun.radius])
                    gl.uniformMatrix4fv(state.program.locations.u_model, false, model.at(-1))
                    gl.uniform3fv(state.program.locations.u_color, sun.color)
                    gl.uniform1i(state.program.locations.u_illuminated, 0)
                    state.geometry.sphere.draw(gl, state.wireframe)
                    gl.uniform1i(state.program.locations.u_illuminated, 1)
                    // agora que já desenhamos o sol, vamos desfazer a última 
                    // transformação, que era a rotação do sol torno de si...
                    // afinal, os planetas não dependem dessa rotação para 
                    // suas posições
                model.pop()
                //
                // agora, o topo da pilha (model.at(-1)) volta ao sistema de
                // coordenadas que está na posição do sol... 
                //
                // portanto, vamos começar as transformações para desenhar mercúrio
                //
                // EXERCÍCIO 1: mercúrio
                // ...
        ```
    - Logo antes de desenhar, defina:
        1. Uniforme `u_model` com a matriz que está no topo da pilha
        1. Uniforme `u_color` com a cor do planeta
        1. Uniforme `u_illuminated` com **1** indicando que o planeta está sob 
           efeito da luz do Sol
- Exercício 2: Vênus
    - Faça o mesmo para Vênus
- Exercício 3: Terra
    - Idem para Terra
- Desafio 1: Lua
    - Mostre que você virou um mestre da modelagem hierárquica e faça
      a Lua orbitar a Terra
- Exercíco 4: Marte
    - Faça Marte
- Desafio 2: Nova câmera, acompanhando um planeta
    - Faça uma nova câmera que acompanhe um corpo celeste em sua órbita
    - Vais precisar fazer continhas com pontos e vetores
        - Use o [`v3`][v3-docs] de `import { v3 } from './twgl.full.module.js`
    - Ideia: encontre a posição **resultante** do planeta no mundo, depois um
      vetor para se distanciar do centro do planeta alguma quantidade nessa
      direção




[m4-docs]: https://twgljs.org/docs/module-twgl_m4.html
[v3-docs]: https://twgljs.org/docs/module-twgl_v3.html