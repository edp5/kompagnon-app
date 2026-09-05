import { fireEvent, render } from "@testing-library/react-native";

import StarRating from "../../components/StarRating";

describe("StarRating — Integration Tests", () => {
    it("says what the rating means, not just a number", () => {
        const { getByTestId } = render(<StarRating value={4} testID="rating" />);

        expect(getByTestId("rating").props.accessibilityLabel).toBe("4 sur 5, Bien");
    });

    it("names what is being rated when told", () => {
        const { getByTestId } = render(<StarRating value={5} label="Note de Léo" testID="rating" />);

        expect(getByTestId("rating").props.accessibilityLabel).toBe("Note de Léo : 5 sur 5, Très bien");
    });

    it("says plainly when nothing has been rated", () => {
        const { getByTestId } = render(<StarRating value={0} testID="rating" />);

        expect(getByTestId("rating").props.accessibilityLabel).toBe("pas encore noté");
    });

    it("makes each star its own choice when editable", () => {
        const onChange = jest.fn();
        const { getByTestId } = render(<StarRating value={0} onChange={onChange} testID="rating" />);

        expect(getByTestId("rating-star-2").props.accessibilityLabel).toBe("2 sur 5, Mauvais");
        fireEvent.press(getByTestId("rating-star-2"));
        expect(onChange).toHaveBeenCalledWith(2);
    });

    it("marks the chosen star as selected", () => {
        const { getByTestId } = render(<StarRating value={3} onChange={jest.fn()} testID="rating" />);

        expect(getByTestId("rating-star-3").props.accessibilityState).toEqual({ selected: true });
        expect(getByTestId("rating-star-4").props.accessibilityState).toEqual({ selected: false });
    });

    it("writes the meaning next to the stars, so it is not colour alone", () => {
        const { getByText } = render(<StarRating value={5} onChange={jest.fn()} testID="rating" />);

        expect(getByText("Très bien")).toBeTruthy();
    });
});
