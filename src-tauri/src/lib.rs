use std::sync::Mutex;

#[derive(serde::Serialize, serde::Deserialize, Clone)]
struct Contract {
    contract_number: String,
    buyer: String,
    seller: String,
    date: String,
    price: String,
    car: Car,
}

impl Contract {
    fn new(
        contract_number: String,
        buyer: String,
        seller: String,
        date: String,
        price: String,
        car_name: String,
        production_date: String,
    ) -> Self {
        Self {
            contract_number,
            buyer,
            seller,
            date,
            price,
            car: Car {
                car_name,
                production_date,
            },
        }
    }
}

#[derive(serde::Serialize, serde::Deserialize, Clone)]
struct Car {
    car_name: String,
    production_date: String,
}

#[derive(serde::Serialize, serde::Deserialize)]
struct State(Mutex<Vec<Contract>>);

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn get_contracts(state: tauri::State<State>) -> Vec<Contract> {
    state.0.lock().unwrap().clone()
}

#[tauri::command]
fn add_contract(
    state: tauri::State<State>,
    contract_number: String,
    buyer: String,
    seller: String,
    date: String,
    price: String,
    car_name: String,
    production_date: String,
) {
    let mut state = state.0.lock().unwrap();

    state.push(Contract::new(
        contract_number,
        buyer,
        seller,
        date,
        price,
        car_name,
        production_date,
    ));
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let state = State(Mutex::new(vec![
        Contract {
            contract_number: "CN-001".to_string(),
            buyer: "Exhibition".to_string(),
            seller: "AutoWorld Ltd.".to_string(),
            date: "2026-01-10".to_string(),
            price: "25000 USD".to_string(),
            car: Car {
                car_name: "Toyota Camry".to_string(),
                production_date: "2023-05-15".to_string(),
            },
        },
        Contract {
            contract_number: "CN-002".to_string(),
            buyer: "Alice Johnson".to_string(),
            seller: "Premium Motors".to_string(),
            date: "2026-01-12".to_string(),
            price: "32000 USD".to_string(),
            car: Car {
                car_name: "BMW 320i".to_string(),
                production_date: "2022-08-20".to_string(),
            },
        },
        Contract {
            contract_number: "CN-003".to_string(),
            buyer: "Robert Brown".to_string(),
            seller: "City Cars".to_string(),
            date: "2026-01-15".to_string(),
            price: "28000 USD".to_string(),
            car: Car {
                car_name: "Honda Accord".to_string(),
                production_date: "2024-02-10".to_string(),
            },
        },
        Contract {
            contract_number: "CN-004".to_string(),
            buyer: "Emily Davis".to_string(),
            seller: "AutoWorld Ltd.".to_string(),
            date: "2026-01-18".to_string(),
            price: "45000 USD".to_string(),
            car: Car {
                car_name: "Mercedes-Benz C-Class".to_string(),
                production_date: "2023-11-05".to_string(),
            },
        },
        Contract {
            contract_number: "CN-005".to_string(),
            buyer: "Michael Wilson".to_string(),
            seller: "Elite Auto".to_string(),
            date: "2026-01-20".to_string(),
            price: "22000 USD".to_string(),
            car: Car {
                car_name: "Hyundai Tucson".to_string(),
                production_date: "2023-03-25".to_string(),
            },
        },
        Contract {
            contract_number: "CN-006".to_string(),
            buyer: "Sarah Miller".to_string(),
            seller: "Exhibition".to_string(),
            date: "2026-01-22".to_string(),
            price: "35000 USD".to_string(),
            car: Car {
                car_name: "Audi A4".to_string(),
                production_date: "2022-12-12".to_string(),
            },
        },
        Contract {
            contract_number: "CN-007".to_string(),
            buyer: "David Garcia".to_string(),
            seller: "Exhibition".to_string(),
            date: "2026-01-25".to_string(),
            price: "19000 USD".to_string(),
            car: Car {
                car_name: "Volkswagen Golf".to_string(),
                production_date: "2024-01-30".to_string(),
            },
        },
        Contract {
            contract_number: "CN-008".to_string(),
            buyer: "Exhibition".to_string(),
            seller: "Elite Auto".to_string(),
            date: "2026-01-28".to_string(),
            price: "52000 USD".to_string(),
            car: Car {
                car_name: "Tesla Model 3".to_string(),
                production_date: "2024-06-18".to_string(),
            },
        },
        Contract {
            contract_number: "CN-009".to_string(),
            buyer: "William Anderson".to_string(),
            seller: "AutoWorld Ltd.".to_string(),
            date: "2026-02-01".to_string(),
            price: "27000 USD".to_string(),
            car: Car {
                car_name: "Mazda CX-5".to_string(),
                production_date: "2023-09-14".to_string(),
            },
        },
        Contract {
            contract_number: "CN-010".to_string(),
            buyer: "Exhibition".to_string(),
            seller: "Premium Motors".to_string(),
            date: "2026-02-05".to_string(),
            price: "38000 USD".to_string(),
            car: Car {
                car_name: "Kia Sportage".to_string(),
                production_date: "2024-04-22".to_string(),
            },
        },
    ]));

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(state)
        .invoke_handler(tauri::generate_handler![greet, get_contracts, add_contract])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
