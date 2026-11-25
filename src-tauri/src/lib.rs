use chrono::{Datelike, NaiveDate};
use jalali_calendar::JalaliDate;
use std::{collections::HashMap, sync::Mutex, vec};

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

fn sample_app_state() -> AppState {
    // Reference date: 2026-11-24. All dates are Gregorian NaiveDate values.
    // Dataset spans 2025-08 .. 2026-11 with active agreements ending in the future.
    // Lifecycle invariants baked in:
    //   - Purchase contract date == inventory entry date (owned items).
    //   - Sale contract date == inventory removal date; every Sold item has exactly one sale.
    //   - Withdrawn items have no sale contract.
    //   - Consigned items: exactly one agreement; start date == entry date.
    //     Active -> InStock/closed None; Completed -> Sold/closed == sale date;
    //     Expired & Cancelled -> Withdrawn, closed == end date / early date.
    //   - Consigned sale contracts: seller_id == agreement owner.
    //   - Extra costs only on Owned items, dated inside the item's stay.
    //   - Car 7 and Car 18 each have two non-overlapping stays (re-acquired / re-consigned).

    // Concise constructor for the seed's fixed Gregorian dates. Panics only if a
    // seed date were not a real calendar day — all values below are valid.
    fn d(year: i32, month: u32, day: u32) -> NaiveDate {
        NaiveDate::from_ymd_opt(year, month, day)
            .expect("seed data contains only valid calendar dates")
    }

    AppState {
        // -------------------------------------------------------------
        // CARS (39)
        // -------------------------------------------------------------
        cars: vec![
            Car {
                id: 1,
                car_name: "Toyota Camry 2.5 Hybrid".to_string(),
                production_date: 2022,
            },
            Car {
                id: 2,
                car_name: "Honda Civic 1.5T Touring".to_string(),
                production_date: 2023,
            },
            Car {
                id: 3,
                car_name: "BMW 330i M Sport".to_string(),
                production_date: 2021,
            },
            Car {
                id: 4,
                car_name: "Mercedes-Benz C 200 AMG Line".to_string(),
                production_date: 2022,
            },
            Car {
                id: 5,
                car_name: "Audi A4 40 TFSI S line".to_string(),
                production_date: 2020,
            },
            Car {
                id: 6,
                car_name: "Volkswagen Golf GTI Performance".to_string(),
                production_date: 2021,
            },
            Car {
                id: 7,
                car_name: "Toyota RAV4 Hybrid XLE".to_string(),
                production_date: 2021,
            },
            Car {
                id: 8,
                car_name: "Ford F-150 XLT SuperCrew".to_string(),
                production_date: 2019,
            },
            Car {
                id: 9,
                car_name: "Hyundai Tucson 1.6T Preferred".to_string(),
                production_date: 2022,
            },
            Car {
                id: 10,
                car_name: "Kia Sportage LX".to_string(),
                production_date: 2021,
            },
            Car {
                id: 11,
                car_name: "Lexus RX 350 Luxury".to_string(),
                production_date: 2020,
            },
            Car {
                id: 12,
                car_name: "Mazda CX-5 Grand Touring".to_string(),
                production_date: 2022,
            },
            Car {
                id: 13,
                car_name: "Volvo XC60 B5 Momentum".to_string(),
                production_date: 2021,
            },
            Car {
                id: 14,
                car_name: "Porsche Macan S".to_string(),
                production_date: 2019,
            },
            Car {
                id: 15,
                car_name: "Nissan Altima 2.5 SV".to_string(),
                production_date: 2022,
            },
            Car {
                id: 16,
                car_name: "Chevrolet Tahoe LT".to_string(),
                production_date: 2020,
            },
            Car {
                id: 17,
                car_name: "BMW X5 xDrive40i".to_string(),
                production_date: 2020,
            },
            Car {
                id: 18,
                car_name: "Honda Civic EX".to_string(),
                production_date: 2019,
            },
            Car {
                id: 19,
                car_name: "Mercedes-Benz GLC 300 4MATIC".to_string(),
                production_date: 2021,
            },
            Car {
                id: 20,
                car_name: "Audi Q5 45 TFSI quattro".to_string(),
                production_date: 2022,
            },
            Car {
                id: 21,
                car_name: "Toyota Corolla LE".to_string(),
                production_date: 2021,
            },
            Car {
                id: 22,
                car_name: "Ford Explorer XLT".to_string(),
                production_date: 2021,
            },
            Car {
                id: 23,
                car_name: "Hyundai Sonata SEL".to_string(),
                production_date: 2023,
            },
            Car {
                id: 24,
                car_name: "Kia Telluride EX".to_string(),
                production_date: 2020,
            },
            Car {
                id: 25,
                car_name: "Lexus ES 350 F Sport".to_string(),
                production_date: 2021,
            },
            Car {
                id: 26,
                car_name: "Mazda 3 Preferred".to_string(),
                production_date: 2023,
            },
            Car {
                id: 27,
                car_name: "Volvo S60 B5 Plus".to_string(),
                production_date: 2022,
            },
            Car {
                id: 28,
                car_name: "Porsche 911 Carrera".to_string(),
                production_date: 2018,
            },
            Car {
                id: 29,
                car_name: "Nissan Rogue SV".to_string(),
                production_date: 2022,
            },
            Car {
                id: 30,
                car_name: "Chevrolet Malibu LT".to_string(),
                production_date: 2021,
            },
            Car {
                id: 31,
                car_name: "BMW 530i xDrive".to_string(),
                production_date: 2021,
            },
            Car {
                id: 32,
                car_name: "Toyota Highlander XLE".to_string(),
                production_date: 2020,
            },
            Car {
                id: 33,
                car_name: "Honda CR-V EX-L".to_string(),
                production_date: 2022,
            },
            Car {
                id: 34,
                car_name: "Volkswagen Tiguan SE".to_string(),
                production_date: 2021,
            },
            Car {
                id: 35,
                car_name: "Audi A6 55 TFSI quattro".to_string(),
                production_date: 2020,
            },
            Car {
                id: 36,
                car_name: "Mercedes-Benz E 450 4MATIC".to_string(),
                production_date: 2021,
            },
            Car {
                id: 37,
                car_name: "Ford Mustang GT Premium".to_string(),
                production_date: 2019,
            },
            Car {
                id: 38,
                car_name: "Hyundai Elantra Limited".to_string(),
                production_date: 2023,
            },
            Car {
                id: 39,
                car_name: "Kia K5 GT-Line".to_string(),
                production_date: 2022,
            },
        ],

        // -------------------------------------------------------------
        // INVENTORY ITEMS (41)
        //   Owned  ids 1-24  (InStock 8, Sold 14, Withdrawn 2)
        //   Consigned ids 25-41 (Active 7, Completed 7, Expired 2, Cancelled 1)
        // -------------------------------------------------------------
        inventory_items: vec![
            // ---- Owned: sold in 2025 ----
            InventoryItem {
                id: 1,
                car_id: 1,
                acquisition_type: AcquisitionType::Owned,
                status: InventoryStatus::Sold,
                entry_date: d(2025, 8, 12),
                removal_date: Some(d(2025, 10, 3)),
            },
            InventoryItem {
                id: 2,
                car_id: 2,
                acquisition_type: AcquisitionType::Owned,
                status: InventoryStatus::Sold,
                entry_date: d(2025, 8, 28),
                removal_date: Some(d(2025, 10, 21)),
            },
            InventoryItem {
                id: 3,
                car_id: 3,
                acquisition_type: AcquisitionType::Owned,
                status: InventoryStatus::Sold,
                entry_date: d(2025, 9, 9),
                removal_date: Some(d(2025, 11, 5)),
            },
            // Car 7, first stay (sold, later re-acquired as item 16).
            InventoryItem {
                id: 4,
                car_id: 7,
                acquisition_type: AcquisitionType::Owned,
                status: InventoryStatus::Sold,
                entry_date: d(2025, 9, 5),
                removal_date: Some(d(2025, 11, 12)),
            },
            InventoryItem {
                id: 5,
                car_id: 4,
                acquisition_type: AcquisitionType::Owned,
                status: InventoryStatus::Sold,
                entry_date: d(2025, 9, 25),
                removal_date: Some(d(2025, 12, 10)),
            },
            InventoryItem {
                id: 6,
                car_id: 5,
                acquisition_type: AcquisitionType::Owned,
                status: InventoryStatus::Sold,
                entry_date: d(2025, 10, 14),
                removal_date: Some(d(2025, 12, 2)),
            },
            InventoryItem {
                id: 7,
                car_id: 6,
                acquisition_type: AcquisitionType::Owned,
                status: InventoryStatus::Sold,
                entry_date: d(2025, 11, 6),
                removal_date: Some(d(2026, 1, 15)),
            },
            InventoryItem {
                id: 8,
                car_id: 8,
                acquisition_type: AcquisitionType::Owned,
                status: InventoryStatus::Sold,
                entry_date: d(2025, 11, 18),
                removal_date: Some(d(2026, 2, 6)),
            },
            // Owned, withdrawn (no sale).
            InventoryItem {
                id: 9,
                car_id: 30,
                acquisition_type: AcquisitionType::Owned,
                status: InventoryStatus::Withdrawn,
                entry_date: d(2025, 12, 17),
                removal_date: Some(d(2026, 3, 9)),
            },
            InventoryItem {
                id: 10,
                car_id: 11,
                acquisition_type: AcquisitionType::Owned,
                status: InventoryStatus::Sold,
                entry_date: d(2025, 12, 9),
                removal_date: Some(d(2026, 2, 18)),
            },
            // ---- Owned: sold in 2026 ----
            InventoryItem {
                id: 11,
                car_id: 12,
                acquisition_type: AcquisitionType::Owned,
                status: InventoryStatus::Sold,
                entry_date: d(2026, 1, 12),
                removal_date: Some(d(2026, 3, 20)),
            },
            InventoryItem {
                id: 12,
                car_id: 16,
                acquisition_type: AcquisitionType::Owned,
                status: InventoryStatus::Sold,
                entry_date: d(2026, 3, 16),
                removal_date: Some(d(2026, 5, 28)),
            },
            InventoryItem {
                id: 13,
                car_id: 17,
                acquisition_type: AcquisitionType::Owned,
                status: InventoryStatus::Sold,
                entry_date: d(2026, 4, 7),
                removal_date: Some(d(2026, 6, 30)),
            },
            InventoryItem {
                id: 14,
                car_id: 33,
                acquisition_type: AcquisitionType::Owned,
                status: InventoryStatus::Sold,
                entry_date: d(2026, 8, 25),
                removal_date: Some(d(2026, 11, 6)),
            },
            InventoryItem {
                id: 15,
                car_id: 24,
                acquisition_type: AcquisitionType::Owned,
                status: InventoryStatus::Sold,
                entry_date: d(2026, 6, 2),
                removal_date: Some(d(2026, 8, 19)),
            },
            // Car 7, second stay: bought back from the 2025 buyer, now in stock.
            InventoryItem {
                id: 16,
                car_id: 7,
                acquisition_type: AcquisitionType::Owned,
                status: InventoryStatus::InStock,
                entry_date: d(2026, 9, 14),
                removal_date: None,
            },
            // ---- Owned: currently in stock ----
            InventoryItem {
                id: 17,
                car_id: 9,
                acquisition_type: AcquisitionType::Owned,
                status: InventoryStatus::InStock,
                entry_date: d(2026, 10, 2),
                removal_date: None,
            },
            InventoryItem {
                id: 18,
                car_id: 10,
                acquisition_type: AcquisitionType::Owned,
                status: InventoryStatus::InStock,
                entry_date: d(2026, 9, 20),
                removal_date: None,
            },
            InventoryItem {
                id: 19,
                car_id: 13,
                acquisition_type: AcquisitionType::Owned,
                status: InventoryStatus::InStock,
                entry_date: d(2026, 8, 14),
                removal_date: None,
            },
            InventoryItem {
                id: 20,
                car_id: 21,
                acquisition_type: AcquisitionType::Owned,
                status: InventoryStatus::InStock,
                entry_date: d(2026, 6, 24),
                removal_date: None,
            },
            InventoryItem {
                id: 21,
                car_id: 23,
                acquisition_type: AcquisitionType::Owned,
                status: InventoryStatus::InStock,
                entry_date: d(2026, 11, 10),
                removal_date: None,
            },
            InventoryItem {
                id: 22,
                car_id: 19,
                acquisition_type: AcquisitionType::Owned,
                status: InventoryStatus::InStock,
                entry_date: d(2026, 10, 21),
                removal_date: None,
            },
            InventoryItem {
                id: 23,
                car_id: 28,
                acquisition_type: AcquisitionType::Owned,
                status: InventoryStatus::InStock,
                entry_date: d(2026, 10, 15),
                removal_date: None,
            },
            InventoryItem {
                id: 24,
                car_id: 22,
                acquisition_type: AcquisitionType::Owned,
                status: InventoryStatus::Withdrawn,
                entry_date: d(2026, 2, 19),
                removal_date: Some(d(2026, 6, 8)),
            },
            // ---- Consigned ----
            InventoryItem {
                id: 25,
                car_id: 14,
                acquisition_type: AcquisitionType::Consignment,
                status: InventoryStatus::Sold,
                entry_date: d(2025, 9, 18),
                removal_date: Some(d(2025, 11, 20)),
            },
            InventoryItem {
                id: 26,
                car_id: 15,
                acquisition_type: AcquisitionType::Consignment,
                status: InventoryStatus::InStock,
                entry_date: d(2026, 10, 9),
                removal_date: None,
            },
            InventoryItem {
                id: 27,
                car_id: 20,
                acquisition_type: AcquisitionType::Consignment,
                status: InventoryStatus::Sold,
                entry_date: d(2025, 11, 20),
                removal_date: Some(d(2026, 1, 28)),
            },
            // Car 18, first stay (agreement expired, car returned; re-consigned as item 39).
            InventoryItem {
                id: 28,
                car_id: 18,
                acquisition_type: AcquisitionType::Consignment,
                status: InventoryStatus::Withdrawn,
                entry_date: d(2025, 10, 20),
                removal_date: Some(d(2026, 1, 18)),
            },
            InventoryItem {
                id: 29,
                car_id: 25,
                acquisition_type: AcquisitionType::Consignment,
                status: InventoryStatus::Sold,
                entry_date: d(2026, 2, 12),
                removal_date: Some(d(2026, 4, 3)),
            },
            InventoryItem {
                id: 30,
                car_id: 26,
                acquisition_type: AcquisitionType::Consignment,
                status: InventoryStatus::InStock,
                entry_date: d(2026, 9, 8),
                removal_date: None,
            },
            InventoryItem {
                id: 31,
                car_id: 27,
                acquisition_type: AcquisitionType::Consignment,
                status: InventoryStatus::Sold,
                entry_date: d(2026, 5, 6),
                removal_date: Some(d(2026, 6, 25)),
            },
            InventoryItem {
                id: 32,
                car_id: 29,
                acquisition_type: AcquisitionType::Consignment,
                status: InventoryStatus::InStock,
                entry_date: d(2026, 8, 19),
                removal_date: None,
            },
            InventoryItem {
                id: 33,
                car_id: 31,
                acquisition_type: AcquisitionType::Consignment,
                status: InventoryStatus::Sold,
                entry_date: d(2025, 12, 3),
                removal_date: Some(d(2026, 2, 26)),
            },
            InventoryItem {
                id: 34,
                car_id: 32,
                acquisition_type: AcquisitionType::Consignment,
                status: InventoryStatus::InStock,
                entry_date: d(2026, 7, 15),
                removal_date: None,
            },
            InventoryItem {
                id: 35,
                car_id: 34,
                acquisition_type: AcquisitionType::Consignment,
                status: InventoryStatus::Withdrawn,
                entry_date: d(2026, 4, 18),
                removal_date: Some(d(2026, 7, 11)),
            },
            InventoryItem {
                id: 36,
                car_id: 35,
                acquisition_type: AcquisitionType::Consignment,
                status: InventoryStatus::Sold,
                entry_date: d(2026, 6, 16),
                removal_date: Some(d(2026, 8, 7)),
            },
            InventoryItem {
                id: 37,
                car_id: 36,
                acquisition_type: AcquisitionType::Consignment,
                status: InventoryStatus::InStock,
                entry_date: d(2026, 10, 27),
                removal_date: None,
            },
            InventoryItem {
                id: 38,
                car_id: 37,
                acquisition_type: AcquisitionType::Consignment,
                status: InventoryStatus::Withdrawn,
                entry_date: d(2026, 1, 22),
                removal_date: Some(d(2026, 4, 20)),
            },
            // Car 18, second stay: re-consigned by the same owner after the expiry.
            InventoryItem {
                id: 39,
                car_id: 18,
                acquisition_type: AcquisitionType::Consignment,
                status: InventoryStatus::InStock,
                entry_date: d(2026, 10, 5),
                removal_date: None,
            },
            InventoryItem {
                id: 40,
                car_id: 38,
                acquisition_type: AcquisitionType::Consignment,
                status: InventoryStatus::InStock,
                entry_date: d(2026, 11, 12),
                removal_date: None,
            },
            InventoryItem {
                id: 41,
                car_id: 39,
                acquisition_type: AcquisitionType::Consignment,
                status: InventoryStatus::Sold,
                entry_date: d(2026, 8, 3),
                removal_date: Some(d(2026, 10, 17)),
            },
        ],

        // -------------------------------------------------------------
        // PEOPLE (30) — all fictional
        // -------------------------------------------------------------
        people: vec![
            Person {
                id: 1,
                name: "Alan Reeves".to_string(),
                phone: Some("+1 555-0142".to_string()),
                address: Some("214 Maple Avenue".to_string()),
            },
            Person {
                id: 2,
                name: "Emily Carter".to_string(),
                phone: Some("+1 555-0158".to_string()),
                address: Some("78 Birchwood Drive".to_string()),
            },
            Person {
                id: 3,
                name: "Marcus Webb".to_string(),
                phone: Some("+1 555-0163".to_string()),
                address: Some("9 Cedar Lane".to_string()),
            },
            Person {
                id: 4,
                name: "Sarah Mitchell".to_string(),
                phone: Some("+1 555-0171".to_string()),
                address: Some("402 Sycamore Court".to_string()),
            },
            Person {
                id: 5,
                name: "Daniel Foster".to_string(),
                phone: Some("+1 555-0129".to_string()),
                address: None,
            },
            Person {
                id: 6,
                name: "Olivia Bennett".to_string(),
                phone: Some("+1 555-0186".to_string()),
                address: Some("15 Juniper Street".to_string()),
            },
            Person {
                id: 7,
                name: "James Holloway".to_string(),
                phone: Some("+1 555-0134".to_string()),
                address: Some("88 Harbor Road".to_string()),
            },
            Person {
                id: 8,
                name: "Priya Sharma".to_string(),
                phone: Some("+1 555-0195".to_string()),
                address: Some("330 Sunset Boulevard".to_string()),
            },
            Person {
                id: 9,
                name: "Thomas Grant".to_string(),
                phone: Some("+1 555-0117".to_string()),
                address: Some("56 Meadowbrook Way".to_string()),
            },
            Person {
                id: 10,
                name: "Rachel Kim".to_string(),
                phone: Some("+1 555-0128".to_string()),
                address: Some("421 Lakeview Terrace".to_string()),
            },
            Person {
                id: 11,
                name: "Victor Alvarez".to_string(),
                phone: Some("+1 555-0153".to_string()),
                address: None,
            },
            Person {
                id: 12,
                name: "Hannah Brooks".to_string(),
                phone: Some("+1 555-0169".to_string()),
                address: None,
            },
            Person {
                id: 13,
                name: "Samuel Reed".to_string(),
                phone: Some("+1 555-0112".to_string()),
                address: Some("27 Chestnut Avenue".to_string()),
            },
            Person {
                id: 14,
                name: "Laura Whitfield".to_string(),
                phone: None,
                address: Some("640 Willow Creek Road".to_string()),
            },
            Person {
                id: 15,
                name: "Nathan Cole".to_string(),
                phone: Some("+1 555-0147".to_string()),
                address: Some("19 Aspen Grove".to_string()),
            },
            Person {
                id: 16,
                name: "Grace Sullivan".to_string(),
                phone: Some("+1 555-0182".to_string()),
                address: Some("503 Magnolia Street".to_string()),
            },
            Person {
                id: 17,
                name: "Omar Haddad".to_string(),
                phone: Some("+1 555-0138".to_string()),
                address: Some("711 Poplar Lane".to_string()),
            },
            Person {
                id: 18,
                name: "Fiona Campbell".to_string(),
                phone: Some("+1 555-0161".to_string()),
                address: None,
            },
            Person {
                id: 19,
                name: "Derek Novak".to_string(),
                phone: Some("+1 555-0124".to_string()),
                address: None,
            },
            Person {
                id: 20,
                name: "Amelie Laurent".to_string(),
                phone: Some("+1 555-0191".to_string()),
                address: Some("92 Riverview Drive".to_string()),
            },
            Person {
                id: 21,
                name: "George Peterson".to_string(),
                phone: Some("+1 555-0106".to_string()),
                address: Some("145 Foxhunt Court".to_string()),
            },
            Person {
                id: 22,
                name: "Sofia Ricci".to_string(),
                phone: Some("+1 555-0175".to_string()),
                address: None,
            },
            Person {
                id: 23,
                name: "Liam O'Connor".to_string(),
                phone: Some("+1 555-0109".to_string()),
                address: Some("38 Stonewall Way".to_string()),
            },
            Person {
                id: 24,
                name: "Maya Patel".to_string(),
                phone: Some("+1 555-0189".to_string()),
                address: None,
            },
            Person {
                id: 25,
                name: "Ethan Walsh".to_string(),
                phone: Some("+1 555-0143".to_string()),
                address: Some("260 Foxglove Lane".to_string()),
            },
            Person {
                id: 26,
                name: "Clara Jensen".to_string(),
                phone: None,
                address: None,
            },
            Person {
                id: 27,
                name: "Robert Hayes".to_string(),
                phone: None,
                address: Some("12 Kingfisher Row".to_string()),
            },
            Person {
                id: 28,
                name: "Nora Adeyemi".to_string(),
                phone: Some("+1 555-0119".to_string()),
                address: Some("67 Larkspur Circle".to_string()),
            },
            // People with no transaction history yet.
            Person {
                id: 29,
                name: "Patricia Lane".to_string(),
                phone: Some("+1 555-0131".to_string()),
                address: Some("305 Tanglewood Drive".to_string()),
            },
            Person {
                id: 30,
                name: "Henry Oswald".to_string(),
                phone: Some("+1 555-0121".to_string()),
                address: None,
            },
        ],

        // -------------------------------------------------------------
        // CONTRACTS (45) — Purchase 24 (ids 1-24), Sale 21 (ids 25-45)
        // buyer_id/seller_id: None == the dealership itself
        // -------------------------------------------------------------
        contracts: vec![
            // ---- Purchase contracts ----
            Contract {
                id: 1,
                contract_number: "PUR-2025-001".to_string(),
                inventory_item_id: 1,
                buyer_id: None,
                seller_id: Some(1),
                contract_type: ContractType::Purchase,
                date: d(2025, 8, 12),
                price: 24500,
            },
            Contract {
                id: 2,
                contract_number: "PUR-2025-002".to_string(),
                inventory_item_id: 2,
                buyer_id: None,
                seller_id: Some(2),
                contract_type: ContractType::Purchase,
                date: d(2025, 8, 28),
                price: 24100,
            },
            Contract {
                id: 3,
                contract_number: "PUR-2025-003".to_string(),
                inventory_item_id: 4,
                buyer_id: None,
                seller_id: Some(1),
                contract_type: ContractType::Purchase,
                date: d(2025, 9, 5),
                price: 27300,
            },
            Contract {
                id: 4,
                contract_number: "PUR-2025-004".to_string(),
                inventory_item_id: 3,
                buyer_id: None,
                seller_id: Some(5),
                contract_type: ContractType::Purchase,
                date: d(2025, 9, 9),
                price: 30200,
            },
            Contract {
                id: 5,
                contract_number: "PUR-2025-005".to_string(),
                inventory_item_id: 5,
                buyer_id: None,
                seller_id: Some(7),
                contract_type: ContractType::Purchase,
                date: d(2025, 9, 25),
                price: 33500,
            },
            Contract {
                id: 6,
                contract_number: "PUR-2025-006".to_string(),
                inventory_item_id: 6,
                buyer_id: None,
                seller_id: Some(11),
                contract_type: ContractType::Purchase,
                date: d(2025, 10, 14),
                price: 22800,
            },
            Contract {
                id: 7,
                contract_number: "PUR-2025-007".to_string(),
                inventory_item_id: 7,
                buyer_id: None,
                seller_id: Some(16),
                contract_type: ContractType::Purchase,
                date: d(2025, 11, 6),
                price: 25400,
            },
            Contract {
                id: 8,
                contract_number: "PUR-2025-008".to_string(),
                inventory_item_id: 8,
                buyer_id: None,
                seller_id: Some(23),
                contract_type: ContractType::Purchase,
                date: d(2025, 11, 18),
                price: 29800,
            },
            Contract {
                id: 9,
                contract_number: "PUR-2025-009".to_string(),
                inventory_item_id: 10,
                buyer_id: None,
                seller_id: Some(14),
                contract_type: ContractType::Purchase,
                date: d(2025, 12, 9),
                price: 31200,
            },
            Contract {
                id: 10,
                contract_number: "PUR-2025-010".to_string(),
                inventory_item_id: 9,
                buyer_id: None,
                seller_id: Some(26),
                contract_type: ContractType::Purchase,
                date: d(2025, 12, 17),
                price: 18900,
            },
            Contract {
                id: 11,
                contract_number: "PUR-2026-001".to_string(),
                inventory_item_id: 11,
                buyer_id: None,
                seller_id: Some(19),
                contract_type: ContractType::Purchase,
                date: d(2026, 1, 12),
                price: 26300,
            },
            Contract {
                id: 12,
                contract_number: "PUR-2026-002".to_string(),
                inventory_item_id: 24,
                buyer_id: None,
                seller_id: Some(26),
                contract_type: ContractType::Purchase,
                date: d(2026, 2, 19),
                price: 31700,
            },
            Contract {
                id: 13,
                contract_number: "PUR-2026-003".to_string(),
                inventory_item_id: 12,
                buyer_id: None,
                seller_id: Some(9),
                contract_type: ContractType::Purchase,
                date: d(2026, 3, 16),
                price: 38600,
            },
            Contract {
                id: 14,
                contract_number: "PUR-2026-004".to_string(),
                inventory_item_id: 13,
                buyer_id: None,
                seller_id: Some(5),
                contract_type: ContractType::Purchase,
                date: d(2026, 4, 7),
                price: 44300,
            },
            Contract {
                id: 15,
                contract_number: "PUR-2026-005".to_string(),
                inventory_item_id: 15,
                buyer_id: None,
                seller_id: Some(21),
                contract_type: ContractType::Purchase,
                date: d(2026, 6, 2),
                price: 33900,
            },
            Contract {
                id: 16,
                contract_number: "PUR-2026-006".to_string(),
                inventory_item_id: 20,
                buyer_id: None,
                seller_id: Some(16),
                contract_type: ContractType::Purchase,
                date: d(2026, 6, 24),
                price: 18300,
            },
            Contract {
                id: 17,
                contract_number: "PUR-2026-007".to_string(),
                inventory_item_id: 19,
                buyer_id: None,
                seller_id: Some(7),
                contract_type: ContractType::Purchase,
                date: d(2026, 8, 14),
                price: 33400,
            },
            Contract {
                id: 18,
                contract_number: "PUR-2026-008".to_string(),
                inventory_item_id: 14,
                buyer_id: None,
                seller_id: Some(23),
                contract_type: ContractType::Purchase,
                date: d(2026, 8, 25),
                price: 29300,
            },
            // Buyback: person 12 bought this RAV4 in 2025 (SAL-2025-004) and sells it back.
            Contract {
                id: 19,
                contract_number: "PUR-2026-009".to_string(),
                inventory_item_id: 16,
                buyer_id: None,
                seller_id: Some(12),
                contract_type: ContractType::Purchase,
                date: d(2026, 9, 14),
                price: 26800,
            },
            Contract {
                id: 20,
                contract_number: "PUR-2026-010".to_string(),
                inventory_item_id: 18,
                buyer_id: None,
                seller_id: Some(26),
                contract_type: ContractType::Purchase,
                date: d(2026, 9, 20),
                price: 21600,
            },
            Contract {
                id: 21,
                contract_number: "PUR-2026-011".to_string(),
                inventory_item_id: 17,
                buyer_id: None,
                seller_id: Some(14),
                contract_type: ContractType::Purchase,
                date: d(2026, 10, 2),
                price: 23900,
            },
            Contract {
                id: 22,
                contract_number: "PUR-2026-012".to_string(),
                inventory_item_id: 23,
                buyer_id: None,
                seller_id: Some(27),
                contract_type: ContractType::Purchase,
                date: d(2026, 10, 15),
                price: 88500,
            },
            Contract {
                id: 23,
                contract_number: "PUR-2026-013".to_string(),
                inventory_item_id: 22,
                buyer_id: None,
                seller_id: Some(11),
                contract_type: ContractType::Purchase,
                date: d(2026, 10, 21),
                price: 40100,
            },
            Contract {
                id: 24,
                contract_number: "PUR-2026-014".to_string(),
                inventory_item_id: 21,
                buyer_id: None,
                seller_id: Some(2),
                contract_type: ContractType::Purchase,
                date: d(2026, 11, 10),
                price: 24900,
            },
            // ---- Sale contracts: owned vehicles (seller None == dealership) ----
            Contract {
                id: 25,
                contract_number: "SAL-2025-001".to_string(),
                inventory_item_id: 1,
                buyer_id: Some(3),
                seller_id: None,
                contract_type: ContractType::Sale,
                date: d(2025, 10, 3),
                price: 27800,
            },
            Contract {
                id: 26,
                contract_number: "SAL-2025-002".to_string(),
                inventory_item_id: 2,
                buyer_id: Some(8),
                seller_id: None,
                contract_type: ContractType::Sale,
                date: d(2025, 10, 21),
                price: 26900,
            },
            Contract {
                id: 27,
                contract_number: "SAL-2025-003".to_string(),
                inventory_item_id: 3,
                buyer_id: Some(3),
                seller_id: None,
                contract_type: ContractType::Sale,
                date: d(2025, 11, 5),
                price: 33900,
            },
            Contract {
                id: 28,
                contract_number: "SAL-2025-004".to_string(),
                inventory_item_id: 4,
                buyer_id: Some(12),
                seller_id: None,
                contract_type: ContractType::Sale,
                date: d(2025, 11, 12),
                price: 29900,
            },
            Contract {
                id: 29,
                contract_number: "SAL-2025-006".to_string(),
                inventory_item_id: 6,
                buyer_id: Some(17),
                seller_id: None,
                contract_type: ContractType::Sale,
                date: d(2025, 12, 2),
                price: 24600,
            },
            Contract {
                id: 30,
                contract_number: "SAL-2025-007".to_string(),
                inventory_item_id: 5,
                buyer_id: Some(10),
                seller_id: None,
                contract_type: ContractType::Sale,
                date: d(2025, 12, 10),
                price: 36700,
            },
            Contract {
                id: 31,
                contract_number: "SAL-2026-001".to_string(),
                inventory_item_id: 7,
                buyer_id: Some(22),
                seller_id: None,
                contract_type: ContractType::Sale,
                date: d(2026, 1, 15),
                price: 28200,
            },
            Contract {
                id: 32,
                contract_number: "SAL-2026-003".to_string(),
                inventory_item_id: 8,
                buyer_id: Some(20),
                seller_id: None,
                contract_type: ContractType::Sale,
                date: d(2026, 2, 6),
                price: 31500,
            },
            Contract {
                id: 33,
                contract_number: "SAL-2026-004".to_string(),
                inventory_item_id: 10,
                buyer_id: Some(13),
                seller_id: None,
                contract_type: ContractType::Sale,
                date: d(2026, 2, 18),
                price: 34400,
            },
            Contract {
                id: 34,
                contract_number: "SAL-2026-006".to_string(),
                inventory_item_id: 11,
                buyer_id: Some(8),
                seller_id: None,
                contract_type: ContractType::Sale,
                date: d(2026, 3, 20),
                price: 28700,
            },
            Contract {
                id: 35,
                contract_number: "SAL-2026-008".to_string(),
                inventory_item_id: 12,
                buyer_id: Some(10),
                seller_id: None,
                contract_type: ContractType::Sale,
                date: d(2026, 5, 28),
                price: 41900,
            },
            Contract {
                id: 36,
                contract_number: "SAL-2026-010".to_string(),
                inventory_item_id: 13,
                buyer_id: Some(3),
                seller_id: None,
                contract_type: ContractType::Sale,
                date: d(2026, 6, 30),
                price: 47600,
            },
            Contract {
                id: 37,
                contract_number: "SAL-2026-012".to_string(),
                inventory_item_id: 15,
                buyer_id: Some(25),
                seller_id: None,
                contract_type: ContractType::Sale,
                date: d(2026, 8, 19),
                price: 36800,
            },
            Contract {
                id: 38,
                contract_number: "SAL-2026-014".to_string(),
                inventory_item_id: 14,
                buyer_id: Some(8),
                seller_id: None,
                contract_type: ContractType::Sale,
                date: d(2026, 11, 6),
                price: 31900,
            },
            // ---- Sale contracts: consigned vehicles (seller == agreement owner) ----
            Contract {
                id: 39,
                contract_number: "SAL-2025-005".to_string(),
                inventory_item_id: 25,
                buyer_id: Some(13),
                seller_id: Some(28),
                contract_type: ContractType::Sale,
                date: d(2025, 11, 20),
                price: 41500,
            },
            Contract {
                id: 40,
                contract_number: "SAL-2026-002".to_string(),
                inventory_item_id: 27,
                buyer_id: Some(8),
                seller_id: Some(9),
                contract_type: ContractType::Sale,
                date: d(2026, 1, 28),
                price: 36900,
            },
            Contract {
                id: 41,
                contract_number: "SAL-2026-005".to_string(),
                inventory_item_id: 33,
                buyer_id: Some(20),
                seller_id: Some(21),
                contract_type: ContractType::Sale,
                date: d(2026, 2, 26),
                price: 37500,
            },
            Contract {
                id: 42,
                contract_number: "SAL-2026-007".to_string(),
                inventory_item_id: 29,
                buyer_id: Some(22),
                seller_id: Some(12),
                contract_type: ContractType::Sale,
                date: d(2026, 4, 3),
                price: 33800,
            },
            Contract {
                id: 43,
                contract_number: "SAL-2026-009".to_string(),
                inventory_item_id: 31,
                buyer_id: Some(17),
                seller_id: Some(18),
                contract_type: ContractType::Sale,
                date: d(2026, 6, 25),
                price: 29700,
            },
            Contract {
                id: 44,
                contract_number: "SAL-2026-011".to_string(),
                inventory_item_id: 36,
                buyer_id: Some(10),
                seller_id: Some(4),
                contract_type: ContractType::Sale,
                date: d(2026, 8, 7),
                price: 42900,
            },
            Contract {
                id: 45,
                contract_number: "SAL-2026-013".to_string(),
                inventory_item_id: 41,
                buyer_id: Some(3),
                seller_id: Some(6),
                contract_type: ContractType::Sale,
                date: d(2026, 10, 17),
                price: 26800,
            },
        ],

        // -------------------------------------------------------------
        // EXTRA COSTS (41) — owned items only, dates inside each stay
        // -------------------------------------------------------------
        extra_costs: vec![
            ExtraCost {
                id: 1,
                inventory_item_id: 1,
                title: "Vehicle transportation".to_string(),
                description: "Flatbed transport from previous owner".to_string(),
                price: 350,
                date: d(2025, 8, 14),
            },
            ExtraCost {
                id: 2,
                inventory_item_id: 1,
                title: "Exterior detailing".to_string(),
                description: "Full paint decontamination and polish".to_string(),
                price: 220,
                date: d(2025, 8, 20),
            },
            ExtraCost {
                id: 3,
                inventory_item_id: 1,
                title: "Interior cleaning".to_string(),
                description: "Deep interior shampoo".to_string(),
                price: 130,
                date: d(2025, 9, 1),
            },
            ExtraCost {
                id: 4,
                inventory_item_id: 2,
                title: "Mechanical inspection".to_string(),
                description: "Pre-sale 120-point inspection".to_string(),
                price: 140,
                date: d(2025, 9, 2),
            },
            ExtraCost {
                id: 5,
                inventory_item_id: 3,
                title: "Brake replacement".to_string(),
                description: "Front pads and rotors".to_string(),
                price: 640,
                date: d(2025, 9, 15),
            },
            ExtraCost {
                id: 6,
                inventory_item_id: 3,
                title: "Tire replacement".to_string(),
                description: "Four new all-season tires".to_string(),
                price: 780,
                date: d(2025, 9, 22),
            },
            ExtraCost {
                id: 7,
                inventory_item_id: 3,
                title: "Paint correction".to_string(),
                description: "Buff out door scratches".to_string(),
                price: 310,
                date: d(2025, 10, 1),
            },
            ExtraCost {
                id: 8,
                inventory_item_id: 3,
                title: "Battery replacement".to_string(),
                description: "New OEM battery".to_string(),
                price: 195,
                date: d(2025, 10, 12),
            },
            ExtraCost {
                id: 9,
                inventory_item_id: 4,
                title: "Vehicle transportation".to_string(),
                description: "Transport from trade-in location".to_string(),
                price: 380,
                date: d(2025, 9, 8),
            },
            ExtraCost {
                id: 10,
                inventory_item_id: 5,
                title: "Minor repairs".to_string(),
                description: "Replacement of damaged mirror".to_string(),
                price: 240,
                date: d(2025, 10, 8),
            },
            ExtraCost {
                id: 11,
                inventory_item_id: 5,
                title: "Exterior detailing".to_string(),
                description: "Machine polish and wax".to_string(),
                price: 280,
                date: d(2025, 11, 12),
            },
            ExtraCost {
                id: 12,
                inventory_item_id: 6,
                title: "Battery replacement".to_string(),
                description: "Battery tested low, replaced".to_string(),
                price: 210,
                date: d(2025, 10, 20),
            },
            ExtraCost {
                id: 13,
                inventory_item_id: 6,
                title: "Interior cleaning".to_string(),
                description: "Upholstery steam clean".to_string(),
                price: 130,
                date: d(2025, 11, 4),
            },
            ExtraCost {
                id: 14,
                inventory_item_id: 8,
                title: "Engine maintenance".to_string(),
                description: "Oil service and filters".to_string(),
                price: 520,
                date: d(2025, 12, 1),
            },
            ExtraCost {
                id: 15,
                inventory_item_id: 8,
                title: "Tire replacement".to_string(),
                description: "Two new rear tires".to_string(),
                price: 740,
                date: d(2026, 1, 9),
            },
            ExtraCost {
                id: 16,
                inventory_item_id: 9,
                title: "Minor repairs".to_string(),
                description: "Window regulator repair".to_string(),
                price: 210,
                date: d(2026, 1, 8),
            },
            ExtraCost {
                id: 17,
                inventory_item_id: 10,
                title: "Vehicle transportation".to_string(),
                description: "Transport from seller".to_string(),
                price: 310,
                date: d(2025, 12, 11),
            },
            ExtraCost {
                id: 18,
                inventory_item_id: 10,
                title: "Exterior detailing".to_string(),
                description: "Paint correction and sealant".to_string(),
                price: 260,
                date: d(2025, 12, 15),
            },
            ExtraCost {
                id: 19,
                inventory_item_id: 10,
                title: "Minor repairs".to_string(),
                description: "Infotainment unit reflash".to_string(),
                price: 480,
                date: d(2026, 1, 10),
            },
            ExtraCost {
                id: 20,
                inventory_item_id: 11,
                title: "Tire replacement".to_string(),
                description: "Full set of tires".to_string(),
                price: 690,
                date: d(2026, 1, 20),
            },
            ExtraCost {
                id: 21,
                inventory_item_id: 11,
                title: "Paint correction".to_string(),
                description: "Rear bumper scuff repair".to_string(),
                price: 290,
                date: d(2026, 2, 10),
            },
            ExtraCost {
                id: 22,
                inventory_item_id: 12,
                title: "Brake replacement".to_string(),
                description: "Pads and rotors all around".to_string(),
                price: 720,
                date: d(2026, 3, 24),
            },
            ExtraCost {
                id: 23,
                inventory_item_id: 12,
                title: "Interior cleaning".to_string(),
                description: "Third-row upholstery clean".to_string(),
                price: 150,
                date: d(2026, 4, 14),
            },
            ExtraCost {
                id: 24,
                inventory_item_id: 12,
                title: "Minor repairs".to_string(),
                description: "Trailer harness rewiring".to_string(),
                price: 260,
                date: d(2026, 5, 2),
            },
            ExtraCost {
                id: 25,
                inventory_item_id: 14,
                title: "Vehicle transportation".to_string(),
                description: "Transport from seller".to_string(),
                price: 340,
                date: d(2026, 8, 27),
            },
            ExtraCost {
                id: 26,
                inventory_item_id: 14,
                title: "Interior cleaning".to_string(),
                description: "Detail and odor treatment".to_string(),
                price: 120,
                date: d(2026, 9, 5),
            },
            ExtraCost {
                id: 27,
                inventory_item_id: 15,
                title: "Tire replacement".to_string(),
                description: "Two new tires".to_string(),
                price: 760,
                date: d(2026, 6, 10),
            },
            ExtraCost {
                id: 28,
                inventory_item_id: 15,
                title: "Exterior detailing".to_string(),
                description: "Wax and trim restoration".to_string(),
                price: 240,
                date: d(2026, 7, 1),
            },
            ExtraCost {
                id: 29,
                inventory_item_id: 15,
                title: "Mechanical inspection".to_string(),
                description: "Pre-sale inspection".to_string(),
                price: 170,
                date: d(2026, 6, 15),
            },
            ExtraCost {
                id: 30,
                inventory_item_id: 16,
                title: "Mechanical inspection".to_string(),
                description: "Post-buyback inspection".to_string(),
                price: 160,
                date: d(2026, 9, 18),
            },
            ExtraCost {
                id: 31,
                inventory_item_id: 18,
                title: "Tire replacement".to_string(),
                description: "Four new tires".to_string(),
                price: 640,
                date: d(2026, 9, 26),
            },
            ExtraCost {
                id: 32,
                inventory_item_id: 18,
                title: "Interior cleaning".to_string(),
                description: "Interior detail".to_string(),
                price: 140,
                date: d(2026, 10, 3),
            },
            ExtraCost {
                id: 33,
                inventory_item_id: 19,
                title: "Mechanical inspection".to_string(),
                description: "Volvo dealer health check".to_string(),
                price: 190,
                date: d(2026, 8, 18),
            },
            ExtraCost {
                id: 34,
                inventory_item_id: 19,
                title: "Minor repairs".to_string(),
                description: "Sunroof drain cleaning".to_string(),
                price: 350,
                date: d(2026, 9, 2),
            },
            ExtraCost {
                id: 35,
                inventory_item_id: 20,
                title: "Battery replacement".to_string(),
                description: "New battery".to_string(),
                price: 200,
                date: d(2026, 7, 1),
            },
            ExtraCost {
                id: 36,
                inventory_item_id: 20,
                title: "Interior cleaning".to_string(),
                description: "Carpet extraction".to_string(),
                price: 110,
                date: d(2026, 7, 18),
            },
            ExtraCost {
                id: 37,
                inventory_item_id: 20,
                title: "Tire replacement".to_string(),
                description: "Two new front tires".to_string(),
                price: 610,
                date: d(2026, 8, 14),
            },
            ExtraCost {
                id: 38,
                inventory_item_id: 22,
                title: "Vehicle transportation".to_string(),
                description: "Enclosed transport".to_string(),
                price: 420,
                date: d(2026, 10, 23),
            },
            ExtraCost {
                id: 39,
                inventory_item_id: 23,
                title: "Mechanical inspection".to_string(),
                description: "Porsche pre-sale inspection".to_string(),
                price: 350,
                date: d(2026, 10, 20),
            },
            ExtraCost {
                id: 40,
                inventory_item_id: 23,
                title: "Vehicle transportation".to_string(),
                description: "Flatbed transport".to_string(),
                price: 480,
                date: d(2026, 10, 17),
            },
            ExtraCost {
                id: 41,
                inventory_item_id: 24,
                title: "Mechanical inspection".to_string(),
                description: "Pre-sale inspection".to_string(),
                price: 180,
                date: d(2026, 2, 26),
            },
        ],

        // -------------------------------------------------------------
        // CONSIGNMENT AGREEMENTS (17)
        // Commission: 5 FixedAmount + 12 Percentage (basis points, 500 == 5%)
        // end_date = original contracted end; closed_date = actual closing event
        // -------------------------------------------------------------
        consignment_agreements: vec![
            // Completed: Porsche Macan, owner 28, sold 2025-11-20. Payout 41500-2000=39500 >= 38000.
            ConsignmentAgreement {
                id: 1,
                agreement_number: "CON-2025-001".to_string(),
                inventory_item_id: 25,
                owner_id: 28,
                start_date: d(2025, 9, 18),
                end_date: d(2025, 12, 18),
                closed_date: Some(d(2025, 11, 20)),
                minimum_owner_payout: 38000,
                commission: Commission::FixedAmount { amount: 2000 },
                status: AgreementStatus::Completed,
            },
            // Expired: Civic stay 1 (owner 4), car returned 2026-01-18.
            ConsignmentAgreement {
                id: 2,
                agreement_number: "CON-2025-002".to_string(),
                inventory_item_id: 28,
                owner_id: 4,
                start_date: d(2025, 10, 20),
                end_date: d(2026, 1, 18),
                closed_date: Some(d(2026, 1, 18)),
                minimum_owner_payout: 13000,
                commission: Commission::Percentage { basis_points: 500 },
                status: AgreementStatus::Expired,
            },
            // Completed: Audi Q5, owner 9. Commission 36900*600/10000 = 2214; payout 34686 >= 32000.
            ConsignmentAgreement {
                id: 3,
                agreement_number: "CON-2025-003".to_string(),
                inventory_item_id: 27,
                owner_id: 9,
                start_date: d(2025, 11, 20),
                end_date: d(2026, 2, 20),
                closed_date: Some(d(2026, 1, 28)),
                minimum_owner_payout: 32000,
                commission: Commission::Percentage { basis_points: 600 },
                status: AgreementStatus::Completed,
            },
            // Completed: BMW 530i, owner 21. Commission floor(37500*550/10000) = 2062; payout 35438 >= 33000.
            ConsignmentAgreement {
                id: 4,
                agreement_number: "CON-2025-004".to_string(),
                inventory_item_id: 33,
                owner_id: 21,
                start_date: d(2025, 12, 3),
                end_date: d(2026, 3, 3),
                closed_date: Some(d(2026, 2, 26)),
                minimum_owner_payout: 33000,
                commission: Commission::Percentage { basis_points: 550 },
                status: AgreementStatus::Completed,
            },
            // Expired: Mustang, owner 27, returned on the end date.
            ConsignmentAgreement {
                id: 5,
                agreement_number: "CON-2026-001".to_string(),
                inventory_item_id: 38,
                owner_id: 27,
                start_date: d(2026, 1, 22),
                end_date: d(2026, 4, 20),
                closed_date: Some(d(2026, 4, 20)),
                minimum_owner_payout: 30000,
                commission: Commission::Percentage { basis_points: 600 },
                status: AgreementStatus::Expired,
            },
            // Completed: Lexus ES, owner 12. Payout 33800-1800 = 32000 == minimum (edge: exact match).
            ConsignmentAgreement {
                id: 6,
                agreement_number: "CON-2026-002".to_string(),
                inventory_item_id: 29,
                owner_id: 12,
                start_date: d(2026, 2, 12),
                end_date: d(2026, 5, 12),
                closed_date: Some(d(2026, 4, 3)),
                minimum_owner_payout: 32000,
                commission: Commission::FixedAmount { amount: 1800 },
                status: AgreementStatus::Completed,
            },
            // Cancelled: Tiguan, owner 13, terminated before the end date.
            ConsignmentAgreement {
                id: 7,
                agreement_number: "CON-2026-003".to_string(),
                inventory_item_id: 35,
                owner_id: 13,
                start_date: d(2026, 4, 18),
                end_date: d(2026, 9, 18),
                closed_date: Some(d(2026, 7, 11)),
                minimum_owner_payout: 19000,
                commission: Commission::FixedAmount { amount: 1000 },
                status: AgreementStatus::Cancelled,
            },
            // Completed: Volvo S60, owner 18. Commission 29700*500/10000 = 1485; payout 28215 >= 26000.
            ConsignmentAgreement {
                id: 8,
                agreement_number: "CON-2026-004".to_string(),
                inventory_item_id: 31,
                owner_id: 18,
                start_date: d(2026, 5, 6),
                end_date: d(2026, 8, 6),
                closed_date: Some(d(2026, 6, 25)),
                minimum_owner_payout: 26000,
                commission: Commission::Percentage { basis_points: 500 },
                status: AgreementStatus::Completed,
            },
            // Completed: Audi A6, owner 4. Commission 42900*500/10000 = 2145; payout 40755 >= 38500.
            ConsignmentAgreement {
                id: 9,
                agreement_number: "CON-2026-005".to_string(),
                inventory_item_id: 36,
                owner_id: 4,
                start_date: d(2026, 6, 16),
                end_date: d(2026, 9, 16),
                closed_date: Some(d(2026, 8, 7)),
                minimum_owner_payout: 38500,
                commission: Commission::Percentage { basis_points: 500 },
                status: AgreementStatus::Completed,
            },
            // Active: Highlander, owner 24, ends soon after the reference date.
            ConsignmentAgreement {
                id: 10,
                agreement_number: "CON-2026-006".to_string(),
                inventory_item_id: 34,
                owner_id: 24,
                start_date: d(2026, 7, 15),
                end_date: d(2026, 12, 15),
                closed_date: None,
                minimum_owner_payout: 24000,
                commission: Commission::Percentage { basis_points: 500 },
                status: AgreementStatus::Active,
            },
            // Completed: Kia K5, owner 6. Commission 26800*500/10000 = 1340; payout 25460 >= 23500.
            ConsignmentAgreement {
                id: 11,
                agreement_number: "CON-2026-007".to_string(),
                inventory_item_id: 41,
                owner_id: 6,
                start_date: d(2026, 8, 3),
                end_date: d(2026, 11, 3),
                closed_date: Some(d(2026, 10, 17)),
                minimum_owner_payout: 23500,
                commission: Commission::Percentage { basis_points: 500 },
                status: AgreementStatus::Completed,
            },
            // Active: Rogue, owner 6 (second agreement for this owner).
            ConsignmentAgreement {
                id: 12,
                agreement_number: "CON-2026-008".to_string(),
                inventory_item_id: 32,
                owner_id: 6,
                start_date: d(2026, 8, 19),
                end_date: d(2027, 1, 19),
                closed_date: None,
                minimum_owner_payout: 20000,
                commission: Commission::FixedAmount { amount: 1200 },
                status: AgreementStatus::Active,
            },
            // Active: Mazda 3, owner 15.
            ConsignmentAgreement {
                id: 13,
                agreement_number: "CON-2026-009".to_string(),
                inventory_item_id: 30,
                owner_id: 15,
                start_date: d(2026, 9, 8),
                end_date: d(2027, 2, 8),
                closed_date: None,
                minimum_owner_payout: 16000,
                commission: Commission::Percentage { basis_points: 700 },
                status: AgreementStatus::Active,
            },
            // Active: Civic stay 2 — same car and owner as expired agreement 2, re-consigned.
            ConsignmentAgreement {
                id: 14,
                agreement_number: "CON-2026-010".to_string(),
                inventory_item_id: 39,
                owner_id: 4,
                start_date: d(2026, 10, 5),
                end_date: d(2027, 1, 5),
                closed_date: None,
                minimum_owner_payout: 12500,
                commission: Commission::FixedAmount { amount: 1100 },
                status: AgreementStatus::Active,
            },
            // Active: Altima, owner 4 (third agreement for this owner).
            ConsignmentAgreement {
                id: 15,
                agreement_number: "CON-2026-011".to_string(),
                inventory_item_id: 26,
                owner_id: 4,
                start_date: d(2026, 10, 9),
                end_date: d(2027, 1, 9),
                closed_date: None,
                minimum_owner_payout: 15500,
                commission: Commission::Percentage { basis_points: 500 },
                status: AgreementStatus::Active,
            },
            // Active: E 450, owner 21 (second agreement for this owner).
            ConsignmentAgreement {
                id: 16,
                agreement_number: "CON-2026-012".to_string(),
                inventory_item_id: 37,
                owner_id: 21,
                start_date: d(2026, 10, 27),
                end_date: d(2027, 3, 27),
                closed_date: None,
                minimum_owner_payout: 42000,
                commission: Commission::Percentage { basis_points: 450 },
                status: AgreementStatus::Active,
            },
            // Active: Elantra, owner 15 (second agreement for this owner).
            ConsignmentAgreement {
                id: 17,
                agreement_number: "CON-2026-013".to_string(),
                inventory_item_id: 40,
                owner_id: 15,
                start_date: d(2026, 11, 12),
                end_date: d(2027, 2, 12),
                closed_date: None,
                minimum_owner_payout: 14000,
                commission: Commission::Percentage { basis_points: 500 },
                status: AgreementStatus::Active,
            },
        ],
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(Mutex::new(sample_app_state()))
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
