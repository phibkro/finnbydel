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

export interface MyComboBoxProps<T extends object>
  extends Omit<ComboBoxProps<T>, "children"> {
  label?: string;
  description?: string | null;
  errorMessage?: string | null;
  children: React.ReactNode | ((item: T) => React.ReactNode);
}

export default function MyComboBox<T extends object>({
  label,
  description,
  errorMessage,
  children,
  ...props
}: MyComboBoxProps<T>) {
  return (
    <ComboBox {...props}>
      <Label>{label}</Label>
      <div>
        <Input className="p-2 text-black" />
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
