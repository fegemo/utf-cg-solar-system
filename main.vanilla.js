import { createProgramFromFiles, setupWebGL } from './vanilla-utils/shader.js'
import { grid, axes, sphere } from './vanilla-utils/geometry.js'
import { m4, v3 } from './twgl.full.module.js'
import { interpolateMatrices } from './vanilla-utils/math.js'
// m4 é o utilitário de matrizes da TWGL.js: 
// v3 é o utilitário de ponto ou vetor de 3D: 


export { setupWebGL }

const state = {
    program: {
        id: null,
        locations: {
            u_model: null,
            u_view: null,
            u_projection: null,
            u_showDepth: null,
            u_alpha: null,
            u_color: null,
            u_illuminated: null,
            u_usePerVertexColor: null,
            a_coords: null,
            a_color: null,
            a_normal: null
        }
    },
    geometry: {
        grid: {
            vao: null,
            draw: null
        },
        axes: {
            vao: null,
            draw: null
        },
        sphere: {
            vao: null,
            draw: null
        }
    },
    cameras: {
        current: 0,
        viewMatrix: null,
        transition: {
            from: null,
            to: null,
            t: 0
        },
        views: [
            {
                name: '1) Olhando para sol "a 45º", de perto',
                position: [Math.cos(Math.PI/4) * 500, 200, Math.sin(Math.PI/4) * 500],
                target: [0, 0, 0],
                up: [0, 1, 0]
            },
            {
                name: '2) Olhando para sol "de frente", de longe',
                position: [500, 350, 0],
                target: [0, 0, 0],
                up: [0, 1, 0]
            },
            {
                name: '3) Olhando para sol "de costas"',
                position: [10, 350, -300],
                target: [0, 0, 300],
                up: [0, 1, 0]
            },
            {
                name: '4) Olhando para sol "de cima"',
                position: [0, 400, 0],
                target: [0, 0, 0],
                up: [0, 0, 1]
            },
            // se quiser, adicione outra câmera aqui que ela vai magicamente
            // funcionar:
            // {
            //     name: '',
            //     position: [],
            //     target: [],
            //     up: []
            // }
        ],
    },
    t: 0,
    autoIncrementT: false,
    wireframe: false,
    showDepthBuffer: false,
    celestialBodies: {
        sun: {
            center: [0, 0, 0],
            radius: 50,
            color: new Float32Array([1, 1, 0]),     // amarelão

            // para rotação no próprio eixo
            hour: 0,
            hoursInADay: 10,
            get rotationAngle() {
                return Math.PI * 2 * (this.hour/this.hoursInADay)
            }
        },
        mercury: {
            distanceToSun: 80,
            radius: 5,
            color: new Float32Array([.5, .5, .5]),  // cinza
            
            // rotação no próprio eixo
            hour: 0,
            hoursInADay: 12,
            get rotationAngle() {
                return Math.PI * 2 * (this.hour/this.hoursInADay)
            },

            // "translação" ao redor do sol
            day: 0,
            daysInAYear: 120,
            get translationAngle() {
                return Math.PI * 2 * (this.day/this.daysInAYear)
            }
        },
        venus: {
            distanceToSun: 120,
            radius: 10,
            color: new Float32Array([.3, .7, .9]),  // azul esverdeado

            hour: 0,
            hoursInADay: 16,
            get rotationAngle() {
                return Math.PI * 2 * (this.hour/this.hoursInADay)
            },

            day: 0,
            daysInAYear: 240,
            get translationAngle() {
                return Math.PI * 2 * (this.day/this.daysInAYear)
            }
        },
        earth: {
            distanceToSun: 160,
            radius: 10,
            color: new Float32Array([0, 0.1, 1]),  // azul

            hour: 0,
            hoursInADay: 24,
            get rotationAngle() {
                return Math.PI * 2 * (this.hour/this.hoursInADay)
            },

            day: 0,
            daysInAYear: 365,
            get translationAngle() {
                return Math.PI * 2 * (this.day/this.daysInAYear)
            }
        },
        mars: {
            distanceToSun: 190,
            radius: 8,
            color: new Float32Array([.8, .3, .4]),  // avermelhado
            get rotationAngle() {
                return Math.PI * 2 * (this.hour/this.hoursInADay)
            },

            hour: 0,
            hoursInADay: 22,

            day: 0,
            daysInAYear: 300,
            get translationAngle() {
                return Math.PI * 2 * (this.day/this.daysInAYear)
            }
        },
        moon: {
            distanceToEarth: 30,
            radius: 4,
            color: new Float32Array([.6, .6, .6]),  // cinza
            get rotationAngle() {
                return Math.PI * 2 * (this.hour/this.hoursInADay)
            },

            hour: 0,
            hoursInADay: 24,

            day: 0,
            daysInAYear: 20,
            get translationAngle() {
                return Math.PI * 2 * (this.day/this.daysInAYear)
            }
        }
    },
    helperObjects: [
        {
            // grid representando o plano orbital
            type: 'grid',
            get model() {
                return m4.translation([0, -50, 0])
            }
        },
        {
            // eixos x, y, z
            type: 'axes',
            get model() {
                return m4.identity()
            }
        },
    ],
    keys: {
        ArrowUp: false,
        ArrowDown: false,
        Space: false
    }
}

function activateCamera(newCamera) {
    const cameraMatrix = m4.lookAt(newCamera.position, newCamera.target, newCamera.up)
    const viewMatrix = m4.inverse(cameraMatrix)
    state.cameras.transition = {
        from: state.cameras.viewMatrix,
        to: viewMatrix,
        t: 0
    }
    console.log("Câmera atual:", newCamera.name)
}

export async function initialize(gl, shaderName) {   
    // cria o programa shader a partir de arquivos
    const vsPath = `${shaderName ? shaderName + '.' : ''}vertex.glsl`
    const fsPath = `${shaderName ? shaderName + '.' : ''}fragment.glsl`
    state.program.id = await createProgramFromFiles(gl, vsPath, fsPath)
    state.program.locations.u_model = gl.getUniformLocation(state.program.id, 'u_model')
    state.program.locations.u_view = gl.getUniformLocation(state.program.id, 'u_view')
    state.program.locations.u_projection = gl.getUniformLocation(state.program.id, 'u_projection')
    state.program.locations.u_alpha = gl.getUniformLocation(state.program.id, 'u_alpha')
    state.program.locations.u_showDepth = gl.getUniformLocation(state.program.id, 'u_showDepth')
    state.program.locations.u_illuminated = gl.getUniformLocation(state.program.id, 'u_illuminated')
    state.program.locations.u_color = gl.getUniformLocation(state.program.id, 'u_color')
    state.program.locations.u_usePerVertexColor = gl.getUniformLocation(state.program.id, 'u_usePerVertexColor')
    state.program.locations.a_coords = gl.getAttribLocation(state.program.id, 'a_coords')
    state.program.locations.a_color = gl.getAttribLocation(state.program.id, 'a_color')
    state.program.locations.a_normal = gl.getAttribLocation(state.program.id, 'a_normal')

    // cria a geometria de um cubo unitário na origem
    state.geometry.grid = grid(gl, state.program)
    state.geometry.axes = axes(gl, state.program, 0, 0, 0, 2000, true, false)
    state.geometry.sphere = sphere(gl, state.program)

    // inicializa o estado da aplicação
    gl.useProgram(state.program.id)
    gl.clearColor(0, 0, 0, 1)
    gl.uniform1f(state.program.locations.u_alpha, 1.0)
    gl.uniform1i(state.program.locations.u_showDepth, 0)
    gl.enable(gl.CULL_FACE)
    gl.enable(gl.DEPTH_TEST)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

    // configura a projeção perspectiva
    const fovY = Math.PI / 3    // 60 graus
    const aspectRatio = gl.canvas.width / gl.canvas.height
    const near = 1
    const far = 2000
    const perspectiveMatrix = m4.perspective(fovY, aspectRatio, near, far)
    gl.uniformMatrix4fv(state.program.locations.u_projection, false, perspectiveMatrix)

    // ativa a câmera inicial
    const initialCamera = state.cameras.views[state.cameras.current]
    const cameraMatrix = m4.lookAt(initialCamera.position, initialCamera.target, initialCamera.up)
    state.cameras.viewMatrix = m4.inverse(cameraMatrix)
    activateCamera(initialCamera);

    // inicializa os manipuladores de eventos para teclado para:
    // - setas para cima/baixo: incrementam/decrementam t
    // - barra de espaço: ativa/desativa incremento automático de t
    ['keydown', 'keyup'].forEach((nameOfEvent) => {
        window.addEventListener(nameOfEvent, (e) => {
            if (e.code in state.keys) {
                const newState = (nameOfEvent === 'keydown');
                state.keys[e.code] = newState;
                // previne comportamento padrão da tecla para, por exemplo,
                // evitar que a página role para cima/baixo ao pressionar setas
                e.preventDefault(); 
            }
            
            if (e.code === 'Space' && nameOfEvent === 'keydown') {
                // alterna o estado de autoIncrementT ao pressionar espaço
                state.autoIncrementT = !state.autoIncrementT;
                // previne comportamento padrão da tecla (ex.: rolar a página)
                e.preventDefault();
            }

            if (e.code === 'KeyC' && nameOfEvent === 'keydown') {
                // alterna entre as câmeras ao pressionar a tecla C
                state.cameras.current = (state.cameras.current + 1) % state.cameras.views.length
                activateCamera(state.cameras.views[state.cameras.current])
            }

            if (e.code === 'KeyW' && nameOfEvent === 'keydown') {
                // alterna entre projeção ortográfica e perspectiva ao pressionar 'P'
                state.wireframe = !state.wireframe
            }

            if (e.code === 'KeyD' && nameOfEvent === 'keydown') {
                // alterna entre mostrar o buffer de profundidade e a cena renderizada ao pressionar 'D'
                state.showDepthBuffer = !state.showDepthBuffer
                gl.uniform1i(state.program.locations.u_showDepth, state.showDepthBuffer ? 1 : 0)
                console.log("Mostrar buffer de profundidade:", state.showDepthBuffer)
            }
        })
    })

    const cameraSelect = document.getElementById('input-camera')
    cameraSelect.addEventListener('change', (e) => {
        const selectedIndex = e.target.selectedIndex
        state.cameras.current = selectedIndex
        activateCamera(state.cameras.views[selectedIndex])
    })
}

export function render(gl) {
    // renderiza: desenha o VAO que estava ativado
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    // atualiza a câmera
    gl.uniformMatrix4fv(state.program.locations.u_view, false, state.cameras.viewMatrix)

    // instrui shader a usar 1 cor por vértice
    gl.uniform1i(state.program.locations.u_usePerVertexColor, 1)

    // percorre a lista de objetos de apoio (grid e axes) e os desenha
    for (let object of state.helperObjects) {
        gl.bindVertexArray(state.geometry[object.type].vao)
        gl.uniformMatrix4fv(state.program.locations.u_model, false, object.model)
        state.geometry[object.type].draw(gl)
    }

    // ativa o VAO de esfera e configura shader para usar 1 cor por objeto
    gl.bindVertexArray(state.geometry.sphere.vao)
    gl.uniform1i(state.program.locations.u_usePerVertexColor, 0)
    const sun = state.celestialBodies.sun
    const mercury = state.celestialBodies.mercury
    const venus = state.celestialBodies.venus
    const earth = state.celestialBodies.earth
    const mars = state.celestialBodies.mars
    const moon = state.celestialBodies.moon

    // EXERCÍCIO será feito aqui:
    // sol: move sistema para sua posição, gira no eixo, desenha, desfaz o giro
    let model = []
    model.push(m4.identity())
        model.push(m4.translate(model.at(-1), [0, 0, 0]))
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
            // agora, o topo da pilha (model.at(-1)) volta ao sistema de coordenadas 
            // que está na posição do sol... 
            //
            // agora vamos começar as transformações para desenhar mercúrio
            //
            // EXERCÍCIO 1: mercúrio
            model.push(m4.rotateY(model.at(-1), mercury.translationAngle))
                model[model.length - 1] = m4.translate(model.at(-1), [mercury.distanceToSun, 0, 0])
                model[model.length - 1] = m4.rotateY(model.at(-1), mercury.rotationAngle)
                model[model.length - 1] = m4.scale(model.at(-1), [mercury.radius, mercury.radius, mercury.radius])
                gl.uniformMatrix4fv(state.program.locations.u_model, false, model.at(-1))
                gl.uniform3fv(state.program.locations.u_color, mercury.color)
                state.geometry.sphere.draw(gl, state.wireframe)
            model.pop()
            
            // EXERCÍCIO 2: vênus
            model.push(m4.rotateY(model.at(-1), venus.translationAngle))
                model[model.length - 1] = m4.translate(model.at(-1), [venus.distanceToSun, 0, 0])
                model[model.length - 1] = m4.rotateY(model.at(-1), venus.rotationAngle)
                model[model.length - 1] = m4.scale(model.at(-1), [venus.radius, venus.radius, venus.radius])
                gl.uniformMatrix4fv(state.program.locations.u_model, false, model.at(-1))
                gl.uniform3fv(state.program.locations.u_color, venus.color)
                state.geometry.sphere.draw(gl, state.wireframe)
            model.pop()
            
            // EXERCÍCIO 3: terra
            model.push(m4.rotateY(model.at(-1), earth.translationAngle))
                model[model.length - 1] = m4.translate(model.at(-1), [earth.distanceToSun, 0, 0])
                model.push(m4.rotateY(model.at(-1), earth.rotationAngle))
                    model[model.length - 1] = m4.scale(model.at(-1), [earth.radius, earth.radius, earth.radius])
                    gl.uniformMatrix4fv(state.program.locations.u_model, false, model.at(-1))
                    gl.uniform3fv(state.program.locations.u_color, earth.color)
                    state.geometry.sphere.draw(gl, state.wireframe)

                model.pop()

                // DESAFIO 1: fazer a lua na órbita da Terra
                model.push(m4.rotateY(model.at(-1), moon.translationAngle))
                    model[model.length - 1] = m4.translate(model.at(-1), [moon.distanceToEarth, 0, 0])
                    model[model.length - 1] = m4.rotateY(model.at(-1), moon.rotationAngle)
                    model[model.length - 1] = m4.scale(model.at(-1), [moon.radius, moon.radius, moon.radius])
                    gl.uniformMatrix4fv(state.program.locations.u_model, false, model.at(-1))
                    gl.uniform3fv(state.program.locations.u_color, moon.color)
                    state.geometry.sphere.draw(gl, state.wireframe)
                model.pop()

            model.pop()

            // EXERCÍCIO 4: marte
            model.push(m4.rotateY(model.at(-1), mars.translationAngle))
                model[model.length - 1] = m4.translate(model.at(-1), [mars.distanceToSun, 0, 0])
                model[model.length - 1] = m4.rotateY(model.at(-1), mars.rotationAngle)
                model[model.length - 1] = m4.scale(model.at(-1), [mars.radius, mars.radius, mars.radius])
                gl.uniformMatrix4fv(state.program.locations.u_model, false, model.at(-1))
                gl.uniform3fv(state.program.locations.u_color, mars.color)
                state.geometry.sphere.draw(gl, state.wireframe)
            model.pop()


            // DESAFIO 2: câmera seguindo algum corpo celeste (ex.: terra), visualizando
            // o lado oculto do planeta (ou seja, olhando para o planeta "de costas", 
            // com o sol atrás do planeta)
    

    // fim do exercício
}

export function update(dt) {
    // atualiza a câmera para fazer uma transição de uma para outra
    if (state.cameras.transition?.t < 1 && state.cameras.transition?.to !== null) {
        state.cameras.transition.t = Math.min(1, state.cameras.transition.t + dt*2)
        state.cameras.viewMatrix = interpolateMatrices(
            state.cameras.transition.from,
            state.cameras.transition.to,
            state.cameras.transition.t
        )

        if (state.cameras.transition.t >= 1) {
            state.cameras.transition = null
        }
    }

    // atualiza os dados (hora e dia) dos corpos celestes
    for (let body of Object.values(state.celestialBodies)) {
        // cada 1 segundo nosso, passa 1 hora do corpo celeste
        body.hour += dt
        if (body.hour >= body.hoursInADay) {
            body.hour -= body.hoursInADay
        }

        // cada corpo celeste em uma quantidade de horas
        // (segundos nossos) que equivalem a um dia
        // contudo, mercúrio, que é rápido, demoraria 24min...
        // então, bora colocar um multiplicador de velocidade dos dias...
        body.day += dt/body.hoursInADay * 100
        
        if (body.day >= body.daysInAYear) {
            body.day -= body.daysInAYear
        }
    }
}





// ℹ️ necessário apenas para o exemplo, e não para uma aplicação real: 
// expõe o estado para uso na interface (via data-binding)
export { state }
