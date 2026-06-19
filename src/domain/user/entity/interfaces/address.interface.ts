export interface IAddress {
  zipCode: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  number: string;
  complement?: string;
}

export interface IAddressLookupResult {
  zipCode: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
}
