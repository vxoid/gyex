// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use dllvoid::Injector;
use dllvoid::Process;
use std::io;

use serde::Serialize;

#[tauri::command]
fn inject_lla(pid: u32, dll: String) -> Result<(), String> {
  _inject_lla(pid, dll)
    .map_err(|err| format!("Internal error: {err}"))
}

#[tauri::command]
fn inject_th(pid: u32, dll: String) -> Result<(), String> {
  _inject_th(pid, dll)
    .map_err(|err| format!("Internal error: {err}"))
}

fn _inject_th(pid: u32, dll: String) -> io::Result<()> {
  let processes = Process::all()?;

  let process = processes
    .into_iter()
    .find(|process| process.get_id() == &pid)
    .ok_or(io::Error::new(io::ErrorKind::NotFound, format!("Process with pid '{pid}' not found")))?;

  let injector = Injector::new(&dll, process)?;
  
  injector.inject_th().map_err(|err| io::Error::new(
    err.kind(),
    format!("{err}, make sure that injector, dll and process is of same arch")
  ))
}

fn _inject_lla(pid: u32, dll: String) -> io::Result<()> {
  let processes = Process::all()?;

  let process = processes
    .into_iter()
    .find(|process| process.get_id() == &pid)
    .ok_or(io::Error::new(io::ErrorKind::NotFound, format!("Process with pid '{pid}' not found")))?;

  let injector = Injector::new(&dll, process)?;
  
  injector.inject_lla().map_err(|err| io::Error::new(
    err.kind(),
    format!("{err}, make sure that injector, dll and process is of same arch")
  ))
}

#[derive(Serialize)]
struct JSProcess {
  name: String,
  id: u32
}

#[tauri::command]
fn all_processes() -> Vec<JSProcess> {
  let processes = Process::all().unwrap_or(vec![]);

  processes
    .into_iter()
    .map(|process| JSProcess { name: process.get_name().to_string(), id: process.get_id().clone() })
    .collect()
}

fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![inject_lla, inject_th, all_processes])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
