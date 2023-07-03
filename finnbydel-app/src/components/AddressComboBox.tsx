import type { ComboBoxProps, ItemProps } from "react-aria-components";
import {
  ComboBox,
  Input,
  Item,
  Label,
  ListBox,
  Popover,
} from "react-aria-components";
import { Text } from "react-aria-components";

export interface AddressComboBoxProps<T extends object>
  extends Omit<ComboBoxProps<T>, "children"> {
  label?: string;
  description?: string | null;
  errorMessage?: string | null;
  children: React.ReactNode | ((item: T) => React.ReactNode);
}

export default function AddressComboBox<T extends object>({
  label,
  description,
  errorMessage,
  children,
  ...props
}: AddressComboBoxProps<T>) {
  return (
    <ComboBox {...props}>
      <Label>{label}</Label>
      <div className="my-combobox-container">
        <Input />
      </div>
      {description && <Text slot="description">{description}</Text>}
      {errorMessage && <Text slot="errorMessage">{errorMessage}</Text>}
      <Popover>
        <ListBox>{children}</ListBox>
      </Popover>
    </ComboBox>
  );
}

export function MyItem(props: ItemProps) {
  return (
    <Item
      {...props}
      className={({ isFocused, isSelected }) =>
        `my-item ${isFocused ? "focused" : ""} ${isSelected ? "selected" : ""}`
      }
    />
  );
}

/* import {
  ComboBox,
  Input,
  Item,
  Label,
  ListBox,
  Popover,
} from "react-aria-components";
import type { ComboBoxProps } from "react-aria-components";
import fuzzysort from "fuzzysort";
interface Address {
  id: number;
  name: string;
}
export default function AddressComboBox(props: ComboBoxProps<Address>) {
  return (
    <ComboBox {...props}>
      <Label>Favorite Animal</Label>
      <div>
        <Input />
      </div>
      <Popover>
        <ListBox>
          <Item>Aardvark</Item>
          <Item>Cat</Item>
          <Item>Dog</Item>
          <Item>Kangaroo</Item>
          <Item>Panda</Item>
          <Item>Snake</Item>
        </ListBox>
      </Popover>
    </ComboBox>
  );
}
 */
