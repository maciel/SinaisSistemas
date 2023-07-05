import React, { useState, useEffect } from "react";
import "./App.css"
import Exemplo from "./exemplo.txt"
import LineChart from "./Charts/LineChart";
import Complex from "complex.js"

function App() {
  const [botao, setBotao] = useState(false);
  const [sinal, setSinal] = useState();
  const [file, setFile] = useState();
  const [sinalChart, setSinalChart] = useState();
  const [saidaChart, setSaidaChart] = useState();
  const [faseChart, setFaseChart] = useState();
  const [saidaTratadoChart, setSaidaTratadoChart] = useState();
  const [freqAqui, setFreqAqui] = useState();
  const [tipoFuncao, setTipoFuncao] = useState('');
  const [inicio, setInicio] = useState();
  const [fim, setFim] = useState();
  const [serie, setSerie] = useState([]);
  const [numInd, setNumInd] = useState();
  const [denInd, setDenInd] = useState();
  const [numDep, setNumDep] = useState();
  const [denDep, setDenDep] = useState();
  const [atualizar, setAtualizar] = useState(0);
  const [nyquist, setNyquist] = useState(0);


  function readFile(e) {
    e.preventDefault();
    let reader = new FileReader();
    reader.onload = (e) => {
      let text = e.target.result;
      text = text.replace(/,/g, '.')
      let valoresText = text.split("\n")
      let sinal = []
      try {
        valoresText.forEach(element => {
          let valoresNumber = parseFloat(element)
          if (isNaN(valoresNumber)) throw new Error("Há elementos que não são números no arquivo, ou o mesmo não está identado da forma correta")
          sinal.push(valoresNumber)
        })
        setSinal(sinal)
      } catch (err) {
        alert(err.message)
      }

    }
    reader.readAsText(e.target.files[0]);
  }

  function definirSinalChart(signal) {

    var size = []

    if (!botao)
      for (let i = 0 - signal?.length / 2; i < signal?.length - signal?.length / 2; i++) {
        size.push((i / freqAqui))
      }

    else {

      for (let i = parseFloat(inicio); i < parseFloat(fim); i = i + 1 / freqAqui) {
        size.push((i))
      }
    }
    setSinalChart({
      labels: size,
      datasets: [{
        data: sinal,
        backgroundColor: '#FFF',
        borderColor: "#000",
        label: "Sinal de Entrada"
      }],
    })
  }

  function definirFTTChart(output) {

    let saidaReal = []
    output.forEach((element) => saidaReal.push(element.im))

    let size = []
    for (let i = 0; i < saidaReal?.length; i++) {
      size.push(i)
    }

    setSaidaChart({
      labels: size,
      datasets: [{
        data: saidaReal,
        backgroundColor: '#FFF',
        borderColor: "#000",
        label: "Sinal de Saída"
      }],
    })
  }

  function fase(output) {
    var saidaFase = []
    output.forEach((element) => saidaFase.push(element.arg()))

    let size = []

    for (let i = 0; i < saidaFase?.length; i++) {
      size.push(i)
    }

    setFaseChart({
      labels: size,
      datasets: [{
        data: saidaFase,
        backgroundColor: '#FFF',
        borderColor: "#000",
        label: "Sinal de Saída"
      }],
    })
  }

  function frequencia(output) {
    var saidaTratada = []

    for (let i = output.length / 2; i < output.length; i++) saidaTratada.push(2*output[i].abs() / sinal.length)
    for (let i = 0; i < output.length / 2; i++) saidaTratada.push(2*output[i].abs() / sinal.length)
   
    var size = []
    var N = output?.length
    var periodo = 1 / freqAqui
   
    for (let i = -0.5; i < 0.5; i = i + 1 / N) {
      size.push(i / periodo)
    }

    setSaidaTratadoChart({
      labels: size,
      datasets: [{
        data: saidaTratada,
        backgroundColor: '#FFF',
        borderColor: "#000",
        label: "Sinal de Saída Tratado"
      }],
    })
  }

  function expComp(exp) {
    var real = Math.cos(exp)
    var img = Math.sin(exp)

    return new Complex(real, img)
  }


  function FFT(signal) {

    var N = signal?.length

    if (N === 1) return signal
    if (N % 2 > 0) throw new Error("Precisa ser uma potência de 2")

    var parEntrada = []
    var imparEntrada = []

    for (var i = 0; i < N; i = i + 2)  parEntrada.push(signal[i])

    for (var i = 1; i < N; i = i + 2) imparEntrada.push(signal[i])

    var parSaida = FFT(parEntrada)
    var imparSaida = FFT(imparEntrada)
    var fator = []

    for (var i = 0; i < N; i++) fator.push(expComp(-2 * Math.PI * i / N))

    var saida = []
    var j = 0

    for (var i = 0; i < N; i++) {
      saida.push(fator[i].mul(imparSaida[j]).add(parSaida[j]))
      j++
      if (i === N / 2 - 1) j = 0
    }
    return saida
  }

  useEffect(() => {
    definirSinalChart(sinal)
    if (sinal?.length > 0)
      try {
        let saida = FFT(sinal)
        definirFTTChart(saida)
        fase(saida)
        frequencia(saida)
      } catch (err) {
        alert(err)
      }
  }, [sinal, freqAqui]);

  function geradorDeSinal() {
    var novoSinal = []
    var pontos = 1024

    while ((parseFloat(fim) - parseFloat(inicio)) / pontos > 1 / nyquist || (parseFloat(fim) - parseFloat(inicio)) > pontos) pontos = pontos * 2
    var step = (parseFloat(fim) - parseFloat(inicio)) / pontos
   
    for (let i = parseFloat(inicio); i < parseFloat(fim); i = i + step) {
      novoSinal.push(respostaSerie(i))
   
    }
    setFreqAqui(1 / step)
    return novoSinal
  }

  function inserirSerie() {
    if (denInd != '0' && denDep != '0') {
      let serieAtual = serie
      let novoTermo = {
        numInd: parseFloat(numInd) ? parseFloat(numInd) : 1,
        denInd: parseFloat(denInd) ? parseFloat(denInd) : 1,
        numDep: parseFloat(numDep) ? parseFloat(numDep) : 1,
        denDep: parseFloat(denDep) ? parseFloat(denDep) : 1,
        tipo: tipoFuncao
      }
      serieAtual.push(novoTermo)
      let maiorFreq = 0
      serieAtual.forEach(el => {
        if (el.numDep / el.denDep > maiorFreq) maiorFreq = el.numDep / el.denDep
      })
      setNyquist(2 * maiorFreq / Math.PI)
      setSerie(serieAtual)
      setNumInd('')
      setDenInd('')
      setNumDep('')
      setDenDep('')
      setAtualizar(atualizar + 1)
    }
  }

  function respostaSerie(t) {
    let resp = 0
    serie.forEach(el => {
      if (el.tipo === '1') {
        resp = resp + el.numInd / el.denInd
      }
      if (el.tipo === '2') {
        resp = resp + el.numInd / el.denInd * Math.cos((el.numDep / el.denDep) * t)
      }
      if (el.tipo === '3') {
        resp = resp + el.numInd / el.denInd * Math.sin((el.numDep / el.denDep) * t)
      }
      if (el.tipo === '4') {
        resp = resp + el.numInd / el.denInd * Math.exp((el.numDep / el.denDep) * t)
      }
      if (el.tipo === '5') {
        if (t < 0) t = t * -1
        resp = resp + el.numInd / el.denInd * Math.exp((el.numDep / el.denDep) * t)
      }
      if (el.tipo === '6') {
        if (t >= 0) resp = resp + el.numInd / el.denInd * Math.exp((el.numDep / el.denDep) * t)
      }
      if (el.tipo === '7') {
        if (t <= 0) resp = resp + el.numInd / el.denInd * Math.exp((el.numDep / el.denDep) * t)
      }
    })
    return resp
  }

  return (
    <>
      <div className='App'>
        <div style={{ flexDirection: 'column' }}>
          <h3>Selecione como será a entrada</h3>
          <div>
            <button
              onClick={() => setBotao(false)}
              style={botao ? { backgroundColor: 'gray', color: 'whitesmoke' } : null}
            >
              Arquivo .txt
            </button>
            <button
              onClick={() => setBotao(true)}
              style={!botao ? { backgroundColor: 'gray', color: 'whitesmoke' } : null}
            >
              Funções
            </button>
          </div>
        </div>
        <div>
          {!botao ?
            <div style={{ justifyContent: 'center', alignContent: 'center', flexDirection: 'column', textAlign: 'center', alignItems: 'center' }}>
              <span style={{ width: '50%' }}>
                Insira um documento de texto com os valores numéricos separados por uma quebra de linha, ou seja, cada sinal em uma linha como no modelo apresentado a seguir. Nota-se que o total de sinais precisa ser potência de 2.
              </span>
              <div style={{ justifyContent: 'space-around', marginTop: '35px' }}>
                <label
                  htmlFor="upload"
                  style={{
                    cursor: 'pointer',
                    border: '1px solid gray',
                    padding: '5px',
                    borderRadius: '10px',
                    margin: '35px'
                  }}
                >
                  Clique para o upload
                </label>
                <label
                  style={{
                    cursor: 'pointer',
                    border: '1px solid gray',
                    padding: '5px',
                    borderRadius: '10px',
                    margin: '35px'
                  }}
                  onClick={() => { window.open(Exemplo) }}
                >
                  Veja o exemplo
                </label>
              </div>
              <input type='file' style={{ display: 'none' }} id='upload' accept=".txt" onChange={(event) => readFile(event)} onClick={() => setFile('')} value={file} />
              <div style={{ marginTop: '35px', flexDirection: 'column', alignItems: 'center' }}>
                <label>Digite a frequência de aquisição (Hz)</label>
                <input onChange={(event) => setFreqAqui(event.target.value)} style={{ width: '30%' }} type="number" />
              </div>
              {saidaChart && freqAqui ?
                <div style={{ width: '80%', marginTop: '25px' }}>
                  <h3>Sinal de Entrada</h3>
                  <LineChart chartData={sinalChart} />
                  <h3>Sinal de Saída</h3>
                  <LineChart chartData={saidaChart} />
                  <h3>Fase em Radianos</h3>
                  <LineChart chartData={faseChart} />
                  <h3>Espectro de Frequências</h3>
                  <LineChart chartData={saidaTratadoChart} />
                </div>
                : null}
            </div>
            :
            <div style={{ justifyContent: 'center', alignContent: 'center', flexDirection: 'column', textAlign: 'center', alignItems: 'center' }}>
              {serie && serie.map(el => {
                return (
                  <div style={{ marginTop: '35px' }}>
                    {el.tipo === '1' ?
                      <>
                        {el.numInd / el.denInd}
                      </>
                      : el.tipo === '2' ?
                        <>
                          {el.numInd / el.denInd} cos({(el.numDep / el.denDep).toFixed(3)} t)
                        </> : el.tipo === '3' ?
                          <>
                            {el.numInd / el.denInd} sin({(el.numDep / el.denDep).toFixed(3)} t)
                          </> : el.tipo === '4' ?
                            <>
                              {el.numInd / el.denInd} e^({(el.numDep / el.denDep).toFixed(3)} t)
                            </> : el.tipo === '5' ?
                              <>
                                {el.numInd / el.denInd} e^({(el.numDep / el.denDep).toFixed(3)} |t|)
                              </> : el.tipo === '6' ?
                                <>
                                  {el.numInd / el.denInd} e^({(el.numDep / el.denDep).toFixed(3)} t) u(t)
                                </> : el.tipo === '7' ?
                                  <>
                                    {el.numInd / el.denInd} e^({(el.numDep / el.denDep).toFixed(3)} t) u(-t)
                                  </> : null}
                    {" + "}
                  </div>
                )
              })}
              {serie.length ?
                <div style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column', marginTop: '35px' }}>
                  <label>Intervalo</label>
                  <div style={{ alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ marginTop: '35px', flexDirection: 'column', alignItems: 'center' }}>
                      <label>Início</label>
                      <input onChange={event => setInicio(event.target.value)} value={inicio} type="number" />
                    </div>
                    <div style={{ marginTop: '35px', flexDirection: 'column', alignItems: 'center' }}>
                      <label>Fim</label>
                      <input onChange={event => setFim(event.target.value)} value={fim} type="number" />
                    </div>
                  </div>
                  <button onClick={() => setSinal(geradorDeSinal())}>Calcular</button>
                </div>
                : null}
              <div style={{ marginTop: '35px', flexDirection: 'column', alignItems: 'center' }}>
                <label>Inserir novo</label>
                <label>obs: seno e cosseno em radianos</label>
                <select onChange={(event) => setTipoFuncao(event.target.value)} value={tipoFuncao}>
                  <option value=''></option>
                  <option value='1'>Termo Independente</option>
                  <option value='2'>Cosseno</option>
                  <option value='3'>Seno</option>
                  <option value='4'>Exponencial</option>
                  <option value='5'>Exponencial Modular</option>
                  <option value='6'>Exponencial + Degrau Positivo</option>
                  <option value='7'>Exponencial + Degrau Negativo</option>
                </select>
              </div>
              <div>
                {tipoFuncao === '1' ?
                  <div style={{ alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column', marginTop: '35px' }}>
                      <input style={{ width: '30%', marginBottom: '0px' }} type="number" onChange={event => setNumInd(event.target.value)} value={numInd} />
                      <hr style={{ width: '30%' }} />
                      <input style={{ width: '30%', marginTop: '0px' }} type="number" onChange={event => setDenInd(event.target.value)} value={denInd} />
                    </div>
                    <div style={{ flexDirection: 'column' }}>
                      <button onClick={() => inserirSerie()}> Inserir </button>
                      <button onClick={() => setSerie([])}> Limpar Serie </button>
                    </div>
                  </div>
                  : tipoFuncao === '2' ?
                    <div style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                      <div style={{ justifyContent: 'center', alignContent: 'center', justifyItems: 'center', alignItems: 'center' }}>
                        <div style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column', marginTop: '35px' }}>
                          <input style={{ width: '30%', marginBottom: '0px' }} type="number" onChange={event => setNumInd(event.target.value)} value={numInd} />
                          <hr style={{ width: '30%' }} />
                          <input style={{ width: '30%', marginTop: '0px' }} type="number" onChange={event => setDenInd(event.target.value)} value={denInd} />
                        </div>
                        <h2 style={{ margin: '-75px' }}>Cos ( </h2>
                        <div style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column', marginTop: '35px', marginRight: '-75px' }}>
                          <input style={{ width: '30%', marginBottom: '0px' }} type="number" onChange={event => setNumDep(event.target.value)} value={numDep} />
                          <hr style={{ width: '30%' }} />
                          <input style={{ width: '30%', marginTop: '0px' }} type="number" onChange={event => setDenDep(event.target.value)} value={denDep} />
                        </div>
                        <h2 >t )</h2>
                      </div>
                      <div>
                        <button onClick={() => inserirSerie()}> Inserir </button>
                        <button onClick={() => setSerie([])}> Limpar Serie </button>
                      </div>
                    </div>
                    : tipoFuncao === '3' ?
                      <div style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                        <div style={{ justifyContent: 'center', alignContent: 'center', justifyItems: 'center', alignItems: 'center' }}>
                          <div style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column', marginTop: '35px' }}>
                            <input style={{ width: '30%', marginBottom: '0px' }} type="number" onChange={event => setNumInd(event.target.value)} value={numInd} />
                            <hr style={{ width: '30%' }} />
                            <input style={{ width: '30%', marginTop: '0px' }} type="number" onChange={event => setDenInd(event.target.value)} value={denInd} />
                          </div>
                          <h2 style={{ margin: '-75px' }}>Sin ( </h2>
                          <div style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column', marginTop: '35px', marginRight: '-75px' }}>
                            <input style={{ width: '30%', marginBottom: '0px' }} type="number" onChange={event => setNumDep(event.target.value)} value={numDep} />
                            <hr style={{ width: '30%' }} />
                            <input style={{ width: '30%', marginTop: '0px' }} type="number" onChange={event => setDenDep(event.target.value)} value={denDep} />
                          </div>
                          <h2 >t )</h2>
                        </div>
                        <div>
                          <button onClick={() => inserirSerie()}> Inserir </button>
                          <button onClick={() => setSerie([])}> Limpar Serie </button>
                        </div>

                      </div>
                      : tipoFuncao === '4' ?
                        <div style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                          <div style={{ justifyContent: 'center', alignContent: 'center', justifyItems: 'center', alignItems: 'center' }}>
                            <div style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column', marginTop: '35px' }}>
                              <input style={{ width: '30%', marginBottom: '0px' }} type="number" onChange={event => setNumInd(event.target.value)} value={numInd} />
                              <hr style={{ width: '30%' }} />
                              <input style={{ width: '30%', marginTop: '0px' }} type="number" onChange={event => setDenInd(event.target.value)} value={denInd} />
                            </div>
                            <h2 style={{ margin: '-75px' }}>e^ ( </h2>
                            <div style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column', marginTop: '35px', marginRight: '-75px' }}>
                              <input style={{ width: '30%', marginBottom: '0px' }} type="number" onChange={event => setNumDep(event.target.value)} value={numDep} />
                              <hr style={{ width: '30%' }} />
                              <input style={{ width: '30%', marginTop: '0px' }} type="number" onChange={event => setDenDep(event.target.value)} value={denDep} />
                            </div>
                            <h2 >t )</h2>
                          </div>
                          <div>
                            <button onClick={() => inserirSerie()}> Inserir </button>
                            <button onClick={() => setSerie([])}> Limpar Serie </button>
                          </div>

                        </div>
                        : tipoFuncao === '5' ?
                          <div style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                            <div style={{ justifyContent: 'center', alignContent: 'center', justifyItems: 'center', alignItems: 'center' }}>
                              <div style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column', marginTop: '35px' }}>
                                <input style={{ width: '30%', marginBottom: '0px' }} type="number" onChange={event => setNumInd(event.target.value)} value={numInd} />
                                <hr style={{ width: '30%' }} />
                                <input style={{ width: '30%', marginTop: '0px' }} type="number" onChange={event => setDenInd(event.target.value)} value={denInd} />
                              </div>
                              <h2 style={{ margin: '-75px' }}>e^ ( </h2>
                              <div style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column', marginTop: '35px', marginRight: '-75px' }}>
                                <input style={{ width: '30%', marginBottom: '0px' }} type="number" onChange={event => setNumDep(event.target.value)} value={numDep} />
                                <hr style={{ width: '30%' }} />
                                <input style={{ width: '30%', marginTop: '0px' }} type="number" onChange={event => setDenDep(event.target.value)} value={denDep} />
                              </div>
                              <h2 >|t| )</h2>
                            </div>
                            <div>
                              <button onClick={() => inserirSerie()}> Inserir </button>
                              <button onClick={() => setSerie([])}> Limpar Serie </button>
                            </div>
                          </div> : tipoFuncao === '6' ?
                            <div style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                              <div style={{ justifyContent: 'center', alignContent: 'center', justifyItems: 'center', alignItems: 'center' }}>
                                <div style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column', marginTop: '35px' }}>
                                  <input style={{ width: '30%', marginBottom: '0px' }} type="number" onChange={event => setNumInd(event.target.value)} value={numInd} />
                                  <hr style={{ width: '30%' }} />
                                  <input style={{ width: '30%', marginTop: '0px' }} type="number" onChange={event => setDenInd(event.target.value)} value={denInd} />
                                </div>
                                <h2 style={{ margin: '-75px' }}>e^ ( </h2>
                                <div style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column', marginTop: '35px', marginRight: '-75px' }}>
                                  <input style={{ width: '30%', marginBottom: '0px' }} type="number" onChange={event => setNumDep(event.target.value)} value={numDep} />
                                  <hr style={{ width: '30%' }} />
                                  <input style={{ width: '30%', marginTop: '0px' }} type="number" onChange={event => setDenDep(event.target.value)} value={denDep} />
                                </div>
                                <h2 >t) u(t)</h2>
                              </div>
                              <div>
                                <button onClick={() => inserirSerie()}> Inserir </button>
                                <button onClick={() => setSerie([])}> Limpar Serie </button>
                              </div>

                            </div> : tipoFuncao === '7' ?
                              <div style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                                <div style={{ justifyContent: 'center', alignContent: 'center', justifyItems: 'center', alignItems: 'center' }}>
                                  <div style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column', marginTop: '35px' }}>
                                    <input style={{ width: '30%', marginBottom: '0px' }} type="number" onChange={event => setNumInd(event.target.value)} value={numInd} />
                                    <hr style={{ width: '30%' }} />
                                    <input style={{ width: '30%', marginTop: '0px' }} type="number" onChange={event => setDenInd(event.target.value)} value={denInd} />
                                  </div>
                                  <h2 style={{ margin: '-75px' }}>e^ ( </h2>
                                  <div style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column', marginTop: '35px', marginRight: '-75px' }}>
                                    <input style={{ width: '30%', marginBottom: '0px' }} type="number" onChange={event => setNumDep(event.target.value)} value={numDep} />
                                    <hr style={{ width: '30%' }} />
                                    <input style={{ width: '30%', marginTop: '0px' }} type="number" onChange={event => setDenDep(event.target.value)} value={denDep} />
                                  </div>
                                  <h2 >t) u(-t)</h2>
                                </div>
                                <div>
                                  <button onClick={() => inserirSerie()}> Inserir </button>
                                  <button onClick={() => setSerie([])}> Limpar Serie </button>
                                </div>

                              </div>
                              : null}
              </div>
              {saidaChart && freqAqui ?
                <div style={{ width: '80%', marginTop: '25px' }}>
                  <h3>Sinal de Entrada</h3>
                  <LineChart chartData={sinalChart} />
                  <h3>Sinal de Saída</h3>
                  <LineChart chartData={saidaChart} />
                  <h3>Fase em Radianos</h3>
                  <LineChart chartData={faseChart} />
                  <h3>Espectro de Frequências</h3>
                  <LineChart chartData={saidaTratadoChart} />
                </div>
                : null}
            </div>
          }
        </div>
      </div>
    </>
  );
}

export default App;
