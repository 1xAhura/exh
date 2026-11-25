use chrono::{Datelike, NaiveDate};
use jalali_calendar::JalaliDate;
use std::{collections::HashMap, sync::Mutex, vec};

mod sample_data;

/// Represents a person who participates in the exhibition's
/// business operations, such as buying, selling, or owning cars.
#[derive(serde::Serialize, serde::Deserialize, Clone)]
struct Person {
    id: u32,
    name: String,
    phone: Option<String>,
    address: Option<String>,
}

/// Represents a physical vehicle and its basic information.
/// Financial and inventory information is stored separately.
#[derive(serde::Serialize, serde::Deserialize, Clone)]
struct Car {
    id: u32,
    car_name: String,
    production_date: u16,
}

/// Represents a car's particular stay in the exhibition.
/// A car can have multiple inventory items throughout its lifetime.
#[derive(serde::Serialize, serde::Deserialize, Clone)]
struct InventoryItem {
    id: u32,
    car_id: u32,
    acquisition_type: AcquisitionType,
    status: InventoryStatus,
    entry_date: NaiveDate,
    removal_date: Option<NaiveDate>,
}

/// Defines how a car entered the exhibition's inventory.
#[derive(serde::Serialize, serde::Deserialize, Clone, PartialEq)]
enum AcquisitionType {
    /// The exhibition purchased and owns the car.
    Owned,

    /// The car belongs to someone else and is displayed
    /// by the exhibition for potential sale.
    Consignment,
}

/// Represents the current state of a car's inventory item.
#[derive(serde::Serialize, serde::Deserialize, Clone, PartialEq)]
enum InventoryStatus {
    /// The car is currently available in the exhibition.
    InStock,

    /// The car was successfully sold.
    Sold,

    /// The car left the exhibition without being sold.
    Withdrawn,
}

/// Represents a purchase or sale transaction involving
/// a car in the exhibition's inventory.
#[derive(serde::Serialize, serde::Deserialize, Clone)]
struct Contract {
    id: u32,
    contract_number: String,
    inventory_item_id: u32,
    buyer_id: Option<u32>,
    seller_id: Option<u32>,
    contract_type: ContractType,
    date: NaiveDate,
    price: i64,
}

/// Defines whether a contract represents a purchase or sale.
#[derive(serde::Serialize, serde::Deserialize, Copy, Clone, PartialEq)]
enum ContractType {
    Purchase,
    Sale,
}

/// Represents an additional expense associated with
/// an owned car during its stay in the exhibition.
#[derive(serde::Serialize, serde::Deserialize, Clone)]
struct ExtraCost {
    id: u32,
    inventory_item_id: u32,
    title: String,
    description: String,
    price: i64,
    date: NaiveDate,
}

/// Represents an agreement allowing the exhibition to
/// display and sell a vehicle on behalf of its actual owner.
#[derive(serde::Serialize, serde::Deserialize, Clone)]
struct ConsignmentAgreement {
    id: u32,
    agreement_number: String,
    inventory_item_id: u32,
    owner_id: u32,
    start_date: NaiveDate,
    end_date: NaiveDate,
    closed_date: Option<NaiveDate>,
    minimum_owner_payout: i64,
    commission: Commission,
    status: AgreementStatus,
}

/// Defines how the exhibition receives its commission
/// when selling a consigned vehicle.
#[derive(serde::Serialize, serde::Deserialize, Clone)]
enum Commission {
    /// The exhibition receives a fixed amount.
    FixedAmount { amount: i64 },

    /// The exhibition receives a percentage of the sale price.
    /// For example, 500 basis points represents 5%.
    Percentage { basis_points: u16 },
}

/// Represents the current state of a consignment agreement.
#[derive(serde::Serialize, serde::Deserialize, Clone, PartialEq)]
enum AgreementStatus {
    /// The agreement is currently active.
    Active,

    /// The vehicle was successfully sold under this agreement.
    Completed,

    /// The agreement reached its end date without a sale.
    Expired,

    /// The agreement was terminated before its end date.
    Cancelled,
}

struct AppState {
    cars: Vec<Car>,
    inventory_items: Vec<InventoryItem>,
    contracts: Vec<Contract>,
    people: Vec<Person>,
    extra_costs: Vec<ExtraCost>,
    consignment_agreements: Vec<ConsignmentAgreement>,
}

impl AppState {
    fn get_cars(&self) -> Vec<Car> {
        self.cars.clone()
    }

    fn get_items(&self) -> Vec<InventoryItem> {
        self.inventory_items.clone()
    }

    fn get_contracts(&self) -> Vec<Contract> {
        self.contracts.clone()
    }

    fn get_people(&self) -> Vec<Person> {
        self.people.clone()
    }

    fn get_extra_costs(&self) -> Vec<ExtraCost> {
        self.extra_costs.clone()
    }

    fn get_consignment_agreements(&self) -> Vec<ConsignmentAgreement> {
        self.consignment_agreements.clone()
    }

    fn get_inventory_details(&self) -> Result<Vec<InventoryItemResponse>, String> {
        let mut result = vec![];

        for item in self.inventory_items.iter() {
            let car = self.cars.iter().find(|car| car.id == item.car_id);

            if car.is_none() {
                return Err(format!("Car #{} doesn't exist.", item.car_id));
            }

            let car = car.unwrap();

            let extra_costs = self
                .extra_costs
                .iter()
                .filter(|cost| cost.inventory_item_id == item.id)
                .cloned()
                .collect();

            result.push(InventoryItemResponse {
                car: car.clone(),
                item: item.clone(),
                extra_cost: extra_costs,
            });
        }

        Ok(result)
    }

    fn get_inventory_item_details(
        &self,
        inventory_item_id: u32,
    ) -> Result<InventoryItemResponse, String> {
        if let Some(item) = self
            .inventory_items
            .iter()
            .find(|item| item.id == inventory_item_id)
        {
            if let Some(car) = self.cars.iter().find(|car| car.id == item.car_id) {
                let extra_costs = self
                    .extra_costs
                    .iter()
                    .filter(|cost| cost.inventory_item_id == item.id)
                    .cloned()
                    .collect();

                Ok(InventoryItemResponse {
                    car: car.clone(),
                    item: item.clone(),
                    extra_cost: extra_costs,
                })
            } else {
                Err(format!("Car #{} doesn't exist.", item.car_id))
            }
        } else {
            Err(format!("Item #{} doesn't exist.", inventory_item_id))
        }
    }

    fn get_monthly_sales(
        &self,
        year: i32,
        month: u32,
        calendar: CalendarType,
    ) -> MonthlySalesResponse {
        let mut map = HashMap::new();
        let total_days;
        match calendar {
            CalendarType::Gregorian => {
                for contract in self.contracts.iter().filter(|contract| {
                    contract.date.month() == month && contract.date.year() == year
                }) {
                    if contract.contract_type == ContractType::Sale {
                        let amount = map.entry(contract.date.day()).or_insert(0u32);
                        *amount += 1;
                    }
                }

                total_days =
                    NaiveDate::num_days_in_month(&NaiveDate::from_ymd_opt(year, month, 1).unwrap())
            }

            CalendarType::Persian => {
                let start_jalali_date = JalaliDate::new(year, month, 1).unwrap();
                let end_jalali_date =
                    JalaliDate::new(year, month, start_jalali_date.days_in_this_month()).unwrap();

                let (start_year, start_month, start_day) = start_jalali_date.to_gregorian();

                let start_gregorian_date =
                    NaiveDate::from_ymd_opt(start_year, start_month, start_day).unwrap();
                let (end_year, end_month, end_day) = end_jalali_date.to_gregorian();
                let end_gregorian_date =
                    NaiveDate::from_ymd_opt(end_year, end_month, end_day).unwrap();

                for contract in self.contracts.iter().filter(|contract| {
                    start_gregorian_date <= contract.date && contract.date <= end_gregorian_date
                }) {
                    if contract.contract_type == ContractType::Sale {
                        let amount = map
                            .entry(
                                JalaliDate::from_gregorian(
                                    contract.date.year(),
                                    contract.date.month(),
                                    contract.date.day(),
                                )
                                .unwrap()
                                .day(),
                            )
                            .or_insert(0u32);
                        *amount += 1;
                    }
                }

                total_days = JalaliDate::new(year, month, 1)
                    .unwrap()
                    .days_in_this_month() as u8;
            }
        }

        let mut daily_sales_point = vec![];

        for (day, quantity) in map {
            daily_sales_point.push(DailySalesPoint { day, quantity });
        }

        daily_sales_point.sort_by_key(|point| point.day);

        MonthlySalesResponse {
            total_days,
            data: daily_sales_point,
        }
    }

    fn get_yearly_sales(&self, year: i32, calendar: CalendarType) -> YearlySalesResponse {
        let mut map = HashMap::new();
        match calendar {
            CalendarType::Gregorian => {
                for contract in self
                    .contracts
                    .iter()
                    .filter(|contract| contract.date.year() == year)
                {
                    if contract.contract_type == ContractType::Sale {
                        let amount = map.entry(contract.date.month()).or_insert(0u32);
                        *amount += 1;
                    }
                }
            }

            CalendarType::Persian => {
                let start_jalali_date = JalaliDate::new(year, 1, 1).unwrap();
                let end_jalali_date = JalaliDate::new(year, 12, 1).unwrap();

                let end_jalali_date =
                    JalaliDate::new(year, 12, end_jalali_date.days_in_this_month()).unwrap();

                let (start_year, start_month, start_day) = start_jalali_date.to_gregorian();

                let start_gregorian_date =
                    NaiveDate::from_ymd_opt(start_year, start_month, start_day).unwrap();
                let (end_year, end_month, end_day) = end_jalali_date.to_gregorian();
                let end_gregorian_date =
                    NaiveDate::from_ymd_opt(end_year, end_month, end_day).unwrap();

                for contract in self.contracts.iter().filter(|contract| {
                    start_gregorian_date <= contract.date && contract.date <= end_gregorian_date
                }) {
                    if contract.contract_type == ContractType::Sale {
                        let amount = map
                            .entry(
                                JalaliDate::from_gregorian(
                                    contract.date.year(),
                                    contract.date.month(),
                                    contract.date.day(),
                                )
                                .unwrap()
                                .month(),
                            )
                            .or_insert(0u32);
                        *amount += 1;
                    }
                }
            }
        }

        let mut monthly_sales_point = vec![];

        for (month, quantity) in map {
            monthly_sales_point.push(MonthlySalesPoint { month, quantity });
        }

        monthly_sales_point.sort_by_key(|point| point.month);

        YearlySalesResponse {
            data: monthly_sales_point,
        }
    }

    fn update_car(&mut self, updated_car: UpdateCar) -> Result<(), String> {
        if let Some(car) = self
            .cars
            .iter_mut()
            .find(|car| car.id == updated_car.car_id)
        {
            if let Some(name) = updated_car.car_name {
                car.car_name = name;
            }

            if let Some(production_date) = updated_car.production_date {
                car.production_date = production_date;
            }
        } else {
            return Err(format!("Car #{} doesn't exist.", updated_car.car_id));
        }

        Ok(())
    }

    fn update_person(&mut self, updated_person: UpdatePerson) -> Result<(), String> {
        if let Some(person) = self
            .people
            .iter_mut()
            .find(|person| person.id == updated_person.id)
        {
            if let Some(name) = updated_person.name {
                person.name = name;
            }

            if updated_person.phone.is_some() {
                person.phone = updated_person.phone;
            }

            if updated_person.address.is_some() {
                person.address = updated_person.address;
            }
        } else {
            return Err(format!("Person #{} doesn't exist.", updated_person.id));
        }

        Ok(())
    }

    fn update_extra_cost(&mut self, updated_cost: UpdateExtraCost) -> Result<(), String> {
        if let Some(cost) = self
            .extra_costs
            .iter_mut()
            .find(|cost| cost.id == updated_cost.id)
        {
            if let Some(title) = updated_cost.title {
                cost.title = title;
            }

            if let Some(description) = updated_cost.description {
                cost.description = description;
            }

            if let Some(date) = updated_cost.date {
                cost.date = date;
            }

            if let Some(price) = updated_cost.price {
                cost.price = price;
            }
        } else {
            return Err(format!("Cost #{} doesn't exist.", updated_cost.id));
        }

        Ok(())
    }

    fn delete_extra_cost(&mut self, cost_id: u32) -> Result<(), String> {
        if let Some((index, _)) = self
            .extra_costs
            .iter()
            .enumerate()
            .find(|(_, cost)| cost.id == cost_id)
        {
            self.extra_costs.remove(index);
        } else {
            return Err(format!("Cost #{} doesn't exist.", cost_id));
        }

        Ok(())
    }

    fn create_item(
        &mut self,
        item: CreateInventoryItem,
    ) -> Result<CreateInventoryItemResponse, String> {
        let car_next_id = self.cars.iter().map(|car| car.id).max().unwrap_or(0) + 1;

        self.cars.push(Car {
            id: car_next_id,
            car_name: item.car_name,
            production_date: item.production_date,
        });

        let item_next_id = self
            .inventory_items
            .iter()
            .map(|item| item.id)
            .max()
            .unwrap_or(0)
            + 1;

        self.inventory_items.push(InventoryItem {
            id: item_next_id,
            car_id: car_next_id,
            acquisition_type: item.acquisition_type,
            status: InventoryStatus::InStock,
            entry_date: item.entry_date,
            removal_date: None,
        });

        Ok(CreateInventoryItemResponse {
            car_id: car_next_id,
            item_id: item_next_id,
        })
    }

    fn create_purchase_contract(&mut self, contract: CreatePurchaseContract) -> Result<(), String> {
        if let Some(buyer_id) = contract.buyer_id
            && self
                .people
                .iter()
                .find(|person| person.id == buyer_id)
                .is_none()
        {
            return Err(format!("Person #{} doesn't exist", buyer_id));
        }

        if let Some(seller_id) = contract.seller_id
            && self
                .people
                .iter()
                .find(|person| person.id == seller_id)
                .is_none()
        {
            return Err(format!("Person #{} doesn't exist", seller_id));
        }

        let response = self.create_item(CreateInventoryItem {
            car_name: contract.car_name,
            production_date: contract.production_date,
            acquisition_type: AcquisitionType::Owned,
            entry_date: contract.date.clone(),
        })?;

        let next_id = self
            .contracts
            .iter()
            .map(|contract| contract.id)
            .max()
            .unwrap_or(0)
            + 1;

        self.contracts.push(Contract {
            id: next_id,
            contract_number: contract.contract_number,
            inventory_item_id: response.item_id,
            buyer_id: contract.buyer_id,
            seller_id: contract.seller_id,
            contract_type: ContractType::Purchase,
            date: contract.date,
            price: contract.price,
        });

        Ok(())
    }

    fn create_sell_contract(&mut self, contract: CreateSellContract) -> Result<(), String> {
        if let Some(buyer_id) = contract.buyer_id
            && self
                .people
                .iter()
                .find(|person| person.id == buyer_id)
                .is_none()
        {
            return Err(format!("Person #{} doesn't exist", buyer_id));
        }

        if let Some(seller_id) = contract.seller_id
            && self
                .people
                .iter()
                .find(|person| person.id == seller_id)
                .is_none()
        {
            return Err(format!("Person #{} doesn't exist", seller_id));
        }

        if self
            .inventory_items
            .iter()
            .find(|item| item.id == contract.inventory_item_id)
            .is_none()
        {
            return Err(format!(
                "Item #{} doesn't exist",
                contract.inventory_item_id
            ));
        }

        self.sell_inventory_item(contract.inventory_item_id, contract.date.clone())?;

        let next_id = self
            .contracts
            .iter()
            .map(|contract| contract.id)
            .max()
            .unwrap_or(0)
            + 1;

        self.contracts.push(Contract {
            id: next_id,
            contract_number: contract.contract_number,
            inventory_item_id: contract.inventory_item_id,
            buyer_id: contract.buyer_id,
            seller_id: contract.seller_id,
            contract_type: ContractType::Sale,
            date: contract.date,
            price: contract.price,
        });

        Ok(())
    }

    fn sell_inventory_item(&mut self, item_id: u32, removal_date: NaiveDate) -> Result<(), String> {
        if let Some(item) = self
            .inventory_items
            .iter_mut()
            .find(|item| item.id == item_id)
        {
            if item.status != InventoryStatus::InStock {
                return Err(format!("Item #{} is not in stock", item.id));
            }

            item.removal_date = Some(removal_date);
            item.status = InventoryStatus::Sold;
        } else {
            return Err(format!("Item #{} doesn't exist", item_id));
        }

        Ok(())
    }

    fn create_person(&mut self, person: CreatePerson) -> Result<(), String> {
        let next_id = self
            .people
            .iter()
            .map(|person| person.id)
            .max()
            .unwrap_or(0)
            + 1;

        self.people.push(Person {
            id: next_id,
            name: person.name,
            phone: person.phone,
            address: person.address,
        });

        Ok(())
    }

    fn add_extra_cost(&mut self, extra_cost: AddExtraCost) -> Result<(), String> {
        if let Some(item) = self
            .inventory_items
            .iter()
            .find(|item| item.id == extra_cost.inventory_item_id)
        {
            if item.acquisition_type != AcquisitionType::Owned {
                return Err(format!("Item #{} is not owned", item.id));
            }
        } else {
            return Err(format!(
                "Item #{} doesn't exist",
                extra_cost.inventory_item_id
            ));
        }

        let next_id = self
            .extra_costs
            .iter()
            .map(|cost| cost.id)
            .max()
            .unwrap_or(0)
            + 1;

        self.extra_costs.push(ExtraCost {
            id: next_id,
            inventory_item_id: extra_cost.inventory_item_id,
            title: extra_cost.title,
            description: extra_cost.description,
            price: extra_cost.price,
            date: extra_cost.date,
        });

        Ok(())
    }

    fn create_consignment_agreement(
        &mut self,
        agreement: CreateConsignmentAgreement,
    ) -> Result<(), String> {
        if self
            .people
            .iter()
            .find(|person| person.id == agreement.owner_id)
            .is_none()
        {
            return Err(format!("Person #{} doesn't exist", agreement.owner_id));
        }

        let response = self.create_item(CreateInventoryItem {
            car_name: agreement.car_name,
            production_date: agreement.production_date,
            acquisition_type: AcquisitionType::Consignment,
            entry_date: agreement.start_date.clone(),
        })?;

        let next_id = self
            .consignment_agreements
            .iter()
            .map(|agreement| agreement.id)
            .max()
            .unwrap_or(0)
            + 1;

        self.consignment_agreements.push(ConsignmentAgreement {
            id: next_id,
            agreement_number: agreement.agreement_number,
            inventory_item_id: response.item_id,
            owner_id: agreement.owner_id,
            start_date: agreement.start_date,
            end_date: agreement.end_date,
            closed_date: None,
            minimum_owner_payout: agreement.minimum_owner_payout,
            commission: agreement.commission,
            status: AgreementStatus::Active,
        });

        Ok(())
    }

    fn withdraw_inventory_item(
        &mut self,
        item_id: u32,
        removal_date: NaiveDate,
    ) -> Result<(), String> {
        if let Some(item) = self
            .inventory_items
            .iter_mut()
            .find(|item| item.id == item_id)
        {
            if item.status != InventoryStatus::InStock {
                return Err(format!("Item #{} is not in stock", item_id));
            }

            item.removal_date = Some(removal_date);
            item.status = InventoryStatus::Withdrawn;
        } else {
            return Err(format!("Item #{} doesn't exist", item_id));
        }

        Ok(())
    }

    fn complete_consignment_agreement(
        &mut self,
        agreement_id: u32,
        end_date: NaiveDate,
        contract_number: String,
        buyer_id: Option<u32>,
        price: i64,
    ) -> Result<(), String> {
        let agreement = self
            .consignment_agreements
            .iter()
            .find(|agreement| agreement.id == agreement_id)
            .ok_or_else(|| format!("Agreement #{} doesn't exist", agreement_id))?;

        if agreement.status != AgreementStatus::Active {
            return Err(format!("Agreement #{} is not active", agreement.id));
        }

        self.create_sell_contract(CreateSellContract {
            contract_number,
            inventory_item_id: agreement.inventory_item_id,
            buyer_id,
            seller_id: Some(agreement.owner_id),
            date: end_date.clone(),
            price,
        })?;

        let agreement = self
            .consignment_agreements
            .iter_mut()
            .find(|agreement| agreement.id == agreement_id)
            .expect("agreement existence checked above");

        agreement.closed_date = Some(end_date);
        agreement.status = AgreementStatus::Completed;

        Ok(())
    }

    fn expire_consignment_agreement(
        &mut self,
        agreement_id: u32,
        end_date: NaiveDate,
    ) -> Result<(), String> {
        if let Some(agreement) = self
            .consignment_agreements
            .iter()
            .find(|agreement| agreement.id == agreement_id)
        {
            if agreement.status != AgreementStatus::Active {
                return Err(format!("Agreement #{} is not active", agreement.id));
            }

            self.withdraw_inventory_item(agreement.inventory_item_id, end_date.clone())?;
        } else {
            return Err(format!("Agreement #{} doesn't exist", agreement_id));
        }

        let agreement = self
            .consignment_agreements
            .iter_mut()
            .find(|agreement| agreement.id == agreement_id)
            .ok_or_else(|| format!("Agreement #{} doesn't exist", agreement_id))?;

        agreement.closed_date = Some(end_date);
        agreement.status = AgreementStatus::Expired;

        Ok(())
    }

    fn cancel_consignment_agreement(
        &mut self,
        agreement_id: u32,
        end_date: NaiveDate,
    ) -> Result<(), String> {
        if let Some(agreement) = self
            .consignment_agreements
            .iter()
            .find(|agreement| agreement.id == agreement_id)
        {
            if agreement.status != AgreementStatus::Active {
                return Err(format!("Agreement #{} is not active", agreement.id));
            }

            self.withdraw_inventory_item(agreement.inventory_item_id, end_date.clone())?;
        } else {
            return Err(format!("Agreement #{} doesn't exist", agreement_id));
        }

        let agreement = self
            .consignment_agreements
            .iter_mut()
            .find(|agreement| agreement.id == agreement_id)
            .ok_or_else(|| format!("Agreement #{} doesn't exist", agreement_id))?;

        agreement.closed_date = Some(end_date);
        agreement.status = AgreementStatus::Cancelled;

        Ok(())
    }
}

#[tauri::command]
fn get_cars(state: tauri::State<Mutex<AppState>>) -> Result<Vec<Car>, String> {
    let db = state.lock().map_err(|e| e.to_string())?;

    Ok(db.get_cars())
}

#[tauri::command]
fn get_items(state: tauri::State<Mutex<AppState>>) -> Result<Vec<InventoryItem>, String> {
    let db = state.lock().map_err(|e| e.to_string())?;

    Ok(db.get_items())
}

#[tauri::command]
fn get_contracts(state: tauri::State<Mutex<AppState>>) -> Result<Vec<Contract>, String> {
    let db = state.lock().map_err(|e| e.to_string())?;

    Ok(db.get_contracts())
}

#[tauri::command]
fn get_people(state: tauri::State<Mutex<AppState>>) -> Result<Vec<Person>, String> {
    let db = state.lock().map_err(|e| e.to_string())?;

    Ok(db.get_people())
}

#[tauri::command]
fn get_extra_costs(state: tauri::State<Mutex<AppState>>) -> Result<Vec<ExtraCost>, String> {
    let db = state.lock().map_err(|e| e.to_string())?;

    Ok(db.get_extra_costs())
}

#[tauri::command]
fn get_consignment_agreements(
    state: tauri::State<Mutex<AppState>>,
) -> Result<Vec<ConsignmentAgreement>, String> {
    let db = state.lock().map_err(|e| e.to_string())?;

    Ok(db.get_consignment_agreements())
}

#[derive(serde::Serialize)]
struct InventoryItemResponse {
    car: Car,
    item: InventoryItem,
    extra_cost: Vec<ExtraCost>,
}

#[tauri::command]
fn get_inventory_details(
    state: tauri::State<Mutex<AppState>>,
) -> Result<Vec<InventoryItemResponse>, String> {
    let db = state.lock().map_err(|e| e.to_string())?;

    db.get_inventory_details()
}

#[tauri::command]
fn get_inventory_item_details(
    state: tauri::State<Mutex<AppState>>,
    inventory_item_id: u32,
) -> Result<InventoryItemResponse, String> {
    let db = state.lock().map_err(|e| e.to_string())?;

    db.get_inventory_item_details(inventory_item_id)
}

#[derive(serde::Deserialize)]
enum CalendarType {
    Gregorian,
    Persian,
}

#[derive(serde::Serialize)]
struct DailySalesPoint {
    day: u32,
    quantity: u32,
}

#[derive(serde::Serialize)]
struct MonthlySalesResponse {
    total_days: u8,
    data: Vec<DailySalesPoint>,
}

#[derive(serde::Deserialize)]
struct GetMonthlySales {
    year: i32,
    month: u32,
    calendar: CalendarType,
}

#[tauri::command]
fn get_monthly_sales(
    state: tauri::State<Mutex<AppState>>,
    monthly_sales: GetMonthlySales,
) -> Result<MonthlySalesResponse, String> {
    let db = state.lock().map_err(|e| e.to_string())?;

    Ok(db.get_monthly_sales(
        monthly_sales.year,
        monthly_sales.month,
        monthly_sales.calendar,
    ))
}

#[derive(serde::Serialize)]
struct MonthlySalesPoint {
    month: u32,
    quantity: u32,
}

#[derive(serde::Serialize)]
struct YearlySalesResponse {
    data: Vec<MonthlySalesPoint>,
}
#[derive(serde::Deserialize)]
struct GetYearlySales {
    year: i32,
    calendar: CalendarType,
}

#[tauri::command]
fn get_yearly_sales(
    state: tauri::State<Mutex<AppState>>,
    yearly_sales: GetYearlySales,
) -> Result<YearlySalesResponse, String> {
    let db = state.lock().map_err(|e| e.to_string())?;

    Ok(db.get_yearly_sales(yearly_sales.year, yearly_sales.calendar))
}

#[derive(serde::Deserialize)]
struct UpdateCar {
    car_id: u32,
    car_name: Option<String>,
    production_date: Option<u16>,
}

#[tauri::command]
fn update_car(state: tauri::State<Mutex<AppState>>, updated_car: UpdateCar) -> Result<(), String> {
    let mut db = state.lock().map_err(|e| e.to_string())?;

    db.update_car(updated_car)
}

#[derive(serde::Deserialize)]
struct UpdatePerson {
    id: u32,
    name: Option<String>,
    phone: Option<String>,
    address: Option<String>,
}

#[tauri::command]
fn update_person(
    state: tauri::State<Mutex<AppState>>,
    updated_person: UpdatePerson,
) -> Result<(), String> {
    let mut db = state.lock().map_err(|e| e.to_string())?;

    db.update_person(updated_person)
}

#[derive(serde::Deserialize)]
struct UpdateExtraCost {
    id: u32,
    title: Option<String>,
    description: Option<String>,
    date: Option<NaiveDate>,
    price: Option<i64>,
}

#[tauri::command]
fn update_extra_cost(
    state: tauri::State<Mutex<AppState>>,
    updated_cost: UpdateExtraCost,
) -> Result<(), String> {
    let mut db = state.lock().map_err(|e| e.to_string())?;

    db.update_extra_cost(updated_cost)
}

#[tauri::command]
fn delete_extra_cost(state: tauri::State<Mutex<AppState>>, cost_id: u32) -> Result<(), String> {
    let mut db = state.lock().map_err(|e| e.to_string())?;

    db.delete_extra_cost(cost_id)
}

#[derive(serde::Deserialize)]
struct CreateInventoryItem {
    car_name: String,
    production_date: u16,
    acquisition_type: AcquisitionType,
    entry_date: NaiveDate,
}

#[derive(serde::Serialize)]
struct CreateInventoryItemResponse {
    car_id: u32,
    item_id: u32,
}

#[derive(serde::Deserialize)]
struct CreatePurchaseContract {
    contract_number: String,
    buyer_id: Option<u32>,
    seller_id: Option<u32>,
    date: NaiveDate,
    car_name: String,
    production_date: u16,
    price: i64,
}

#[tauri::command]
fn create_purchase_contract(
    state: tauri::State<Mutex<AppState>>,
    contract: CreatePurchaseContract,
) -> Result<(), String> {
    let mut db = state.lock().map_err(|e| e.to_string())?;

    db.create_purchase_contract(contract)
}

#[derive(serde::Deserialize)]
struct CreateSellContract {
    contract_number: String,
    inventory_item_id: u32,
    buyer_id: Option<u32>,
    seller_id: Option<u32>,
    date: NaiveDate,
    price: i64,
}

#[tauri::command]
fn create_sell_contract(
    state: tauri::State<Mutex<AppState>>,
    contract: CreateSellContract,
) -> Result<(), String> {
    let mut db = state.lock().map_err(|e| e.to_string())?;

    db.create_sell_contract(contract)
}

#[derive(serde::Deserialize)]
struct CreatePerson {
    name: String,
    phone: Option<String>,
    address: Option<String>,
}

#[tauri::command]
fn create_person(state: tauri::State<Mutex<AppState>>, person: CreatePerson) -> Result<(), String> {
    let mut db = state.lock().map_err(|e| e.to_string())?;

    db.create_person(person)
}

#[derive(serde::Deserialize)]
struct AddExtraCost {
    inventory_item_id: u32,
    title: String,
    description: String,
    price: i64,
    date: NaiveDate,
}

#[tauri::command]
fn add_extra_cost(
    state: tauri::State<Mutex<AppState>>,
    extra_cost: AddExtraCost,
) -> Result<(), String> {
    let mut db = state.lock().map_err(|e| e.to_string())?;

    db.add_extra_cost(extra_cost)
}

#[derive(serde::Deserialize)]
struct CreateConsignmentAgreement {
    agreement_number: String,
    owner_id: u32,
    car_name: String,
    start_date: NaiveDate,
    end_date: NaiveDate,
    minimum_owner_payout: i64,
    production_date: u16,
    commission: Commission,
}

#[tauri::command]
fn create_consignment_agreement(
    state: tauri::State<Mutex<AppState>>,
    agreement: CreateConsignmentAgreement,
) -> Result<(), String> {
    let mut db = state.lock().map_err(|e| e.to_string())?;

    db.create_consignment_agreement(agreement)
}

#[tauri::command]
fn withdraw_inventory_item(
    state: tauri::State<Mutex<AppState>>,
    item_id: u32,
    removal_date: NaiveDate,
) -> Result<(), String> {
    let mut db = state.lock().map_err(|e| e.to_string())?;

    db.withdraw_inventory_item(item_id, removal_date)
}

#[tauri::command]
fn complete_consignment_agreement(
    state: tauri::State<Mutex<AppState>>,
    agreement_id: u32,
    end_date: NaiveDate,
    contract_number: String,
    buyer_id: Option<u32>,
    price: i64,
) -> Result<(), String> {
    let mut db = state.lock().map_err(|e| e.to_string())?;

    db.complete_consignment_agreement(agreement_id, end_date, contract_number, buyer_id, price)
}

#[tauri::command]
fn expire_consignment_agreement(
    state: tauri::State<Mutex<AppState>>,
    agreement_id: u32,
    end_date: NaiveDate,
) -> Result<(), String> {
    let mut db = state.lock().map_err(|e| e.to_string())?;

    db.expire_consignment_agreement(agreement_id, end_date)
}

#[tauri::command]
fn cancel_consignment_agreement(
    state: tauri::State<Mutex<AppState>>,
    agreement_id: u32,
    end_date: NaiveDate,
) -> Result<(), String> {
    let mut db = state.lock().map_err(|e| e.to_string())?;

    db.cancel_consignment_agreement(agreement_id, end_date)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(Mutex::new(sample_data::sample_app_state()))
        .invoke_handler(tauri::generate_handler![
            get_cars,
            get_items,
            get_contracts,
            get_consignment_agreements,
            get_extra_costs,
            get_people,
            get_inventory_details,
            get_inventory_item_details,
            get_monthly_sales,
            get_yearly_sales,
            update_car,
            update_person,
            update_extra_cost,
            delete_extra_cost,
            create_consignment_agreement,
            create_person,
            create_purchase_contract,
            create_sell_contract,
            add_extra_cost,
            withdraw_inventory_item,
            complete_consignment_agreement,
            expire_consignment_agreement,
            cancel_consignment_agreement,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
