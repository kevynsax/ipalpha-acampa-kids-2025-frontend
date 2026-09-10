import { useCollectionOrEmpty } from "../store";
import { useLabelOf } from "../store/derive";

/** Categories + `labelOf(optionId)` straight from the local store (offline-ready, live). */
export function useCategoryLabels(_token?: string) {
  const categories = useCollectionOrEmpty("categories");
  const labelOf = useLabelOf();
  return { categories, labelOf };
}
