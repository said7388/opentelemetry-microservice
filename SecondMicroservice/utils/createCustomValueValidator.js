export const isInvalidCustomValuePayload = (customValuePayload) => {

    if (customValuePayload.custom_name) {
        const customName = customValuePayload.custom_name.trim();
        if (!customName) return "Custom Name can't be empty.";
    } 
  
    if (customValuePayload.custom_key) {
        const customKey = customValuePayload.custom_key.trim();
        if (!customKey) return "Custom Key can't be empty.";
    } 
    
    if (customValuePayload.custom_value) {
        const customValue = customValuePayload.custom_value.trim();
        if (!customValue) return "Custom Value can't be empty.";
    }

  return null;
};