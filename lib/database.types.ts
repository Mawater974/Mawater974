export interface Database {
  public: {
    Tables: {
      cars: {
        Row: {
          id: string
          brand: string
          model: string
          exact_model: string
          year: string
          mileage: string
          fuel_type: string
          gearbox_type: string
          body_type: string
          condition: string
          color: string
          cylinders: string
          city_id: string
          country_id: string
          description: string
          price: string
          images: string[]
          created_at: string
          updated_at: string
        }
      }
    }
    Enums: {
      fuel_type: 'petrol' | 'diesel' | 'electric' | 'hybrid'
      gearbox_type: 'manual' | 'automatic'
      body_type: 'sedan' | 'suv' | 'hatchback' | 'coupe' | 'convertible' | 'wagon' | 'van' | 'truck'
      condition: 'new' | 'used'
    }
  }
}
