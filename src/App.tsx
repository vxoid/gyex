import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { open } from "@tauri-apps/api/dialog";
import logo from "../src-tauri/icons/32x32.png"

const TYPE_TH: number = 0;
const TYPE_LLA: number = 1;

function App() {
  const [dlls, setDlls] = useState<string[]>([]);
  const [processes, setProcesses] = useState<{name: string; id: number}[]>([]);
  const [process, setProcess] = useState(-1);
  const [type, setType] = useState(TYPE_LLA);
  const [error, setError] = useState<string | undefined>(undefined);

  const handleAddDll = async () => {
    const selected = await open({
      multiple: true,
      filters: [{
        name: "Dll",
        extensions: ["dll"]
      }]
    });

    if (selected == null) {} else if (Array.isArray(selected)) {
      const filtered = selected.filter((selected_dll) => dlls.find((dll) => dll === selected_dll) === undefined)
      setDlls(prevDlls => [...prevDlls, ...filtered]);
    } else {
      if (dlls.find((dll) => dll === selected) == undefined) {
        setDlls(prevDlls => [...prevDlls, selected]);
      }
    }
  };

  const handleInject = () => {
    if (dlls.length < 1) {
      setError("Please add dll to inject");
      return;
    }
    
    if (process === -1) {
      setError("Please choose process!");
      return;
    }
    
    dlls.forEach((dll) => {
      invoke(type === TYPE_LLA ? "inject_lla" : "inject_th", { pid: process, dll: dll })
        .then(() => setError(undefined))
        .catch((error) => setError(error as string))
    })
  }

  const handleProcessChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setProcess(+event.target.value)
  }

  const handleTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setType(+event.target.value)
  }

  const reloadProcesses = () => {
    invoke("all_processes")
      .then((all_processes) => {
        setProcesses(all_processes as {name: string; id: number}[]);
      });
  }

  // const 

  const frequency = 2000

  const handleRemoveDll = (index: number) => {
    setDlls(prevDlls => prevDlls.filter((_, i) => i !== index));
  };

  useEffect(() => {
    reloadProcesses()
    const interval = setInterval(reloadProcesses, frequency);

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="container">
      <div className="logo-head"><img className="logo" src={logo} alt="Logo"/><h2 className="header">Gyex</h2></div>
      <hr/>
      <div className="fs">
        <fieldset className="dlls">
          <legend>Dlls</legend>
          {dlls.map((dll, i) => <div><button className="dll bf28 crop" onClick={() => handleRemoveDll(i)}>{dll}</button><br/></div>)}
        </fieldset>

        <select className="processes" value={process} onChange={handleProcessChange}>
          <option value={-1}>--Please choose a process--</option>
          {processes.map((object) => <option value={object["id"]}>{object["name"]} ({object["id"]})</option>)}
        </select>
        <div className="flex-container">
          <button className="bf28 add" onClick={handleAddDll}>
            Add
          </button>
          <button className="bf28 inject" onClick={handleInject}>
            Inject
          </button>
        </div>
        <div className="type">
          <input type="radio" name="type" id="lla" value={TYPE_LLA} onChange={handleTypeChange} defaultChecked/><label htmlFor="lla">Load Library</label><br/>
          <input type="radio" name="type" id="th" value={TYPE_TH} onChange={handleTypeChange}/><label htmlFor="th">Thread Hijacking</label>
        </div>
        { error === undefined ? <></> : <p className="error">{error}</p> }
      </div>
    </div>
  );
}

export default App;