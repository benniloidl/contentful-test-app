import React, { useEffect, useMemo, useState } from 'react';
import {
	Button, ButtonGroup,
	Flex, FormControl,
	Heading,
	IconButton,
	Modal,
	Option,
	Paragraph,
	Select,
	TextInput
} from '@contentful/f36-components';
import { FieldAppSDK } from '@contentful/app-sdk';
import { /* useCMA, */ useSDK } from '@contentful/react-apps-toolkit';
import { API_URL } from "./Dialog";

interface ProductPreview {
	brand: string;
	name: string;
	code: string;
	image: string;
}

interface CategoryPreview {
	name: string;
	productAmount: number;
	pageSize: number;
}

const Field = () => {
	const sdk = useSDK<FieldAppSDK>();
	sdk.window.startAutoResizer();
	/*
	   To use the cma, inject it as follows.
	   If it is not needed, you can remove the next line.
	*/
	// const cma = useCMA();
	// If you only want to extend Contentful's default editing experience
	// reuse Contentful's editor components
	// -> https://www.contentful.com/developers/docs/extensibility/field-editors/
	
	const [value, setValue] = useState<{
		type: "product" | "category";
		data: string;
	} | undefined>(sdk.field.getValue());
	const [displayedProduct, setDisplayedProduct] = useState<ProductPreview | undefined>(undefined);
	const [displayedCategory, setDisplayedCategory] = useState<CategoryPreview | undefined>(undefined);
	
	const openDialog = () => {
		sdk.dialogs.openCurrentApp({
			title: 'Select an object',
			shouldCloseOnOverlayClick: true,
			shouldCloseOnEscapePress: true,
			minHeight: 600,
			width: 1400
		}).then((data: any) => {
			if (data) {
				console.log("Saving data..");
				
				sdk.field.setValue(data);
				setValue(data);
				
				console.log("Saved data");
			}
		});
	}
	
	useMemo(() => {
		setDisplayedProduct(undefined);
		setDisplayedCategory(undefined);
		
		if (!value) return;
		if (!value.data.startsWith('http')) return;
		
		if (value.type === "product")
			fetch(encodeURI(value.data) + '?fields=manufacturer,name,code,images(FULL)')
				.then(response => response.json())
				.then(data => {
					let images = data.images ?? [];
					let image = images.find((image: any) => image.imageType === 'PRIMARY' && image.format === 'thumbnail');
					setDisplayedProduct({
						brand: data.manufacturer,
						name: data.name,
						code: data.code,
						image: image?.url
					});
				});
		else if (value.type === "category")
			fetch(encodeURI(value.data))
				.then(response => response.json())
				.then(data => {
					let name = data.currentQuery.url.split('/');
					name.pop();
					name.pop();
					
					let url = new URL(value.data);
					let pageSize = url.searchParams.get('pageSize') ?? 3;
					
					setDisplayedCategory({
						name: name.pop().replaceAll("-", " "),
						productAmount: data.pagination.totalResults,
						pageSize
					});
				});
	}, [value]);
	
	return <>
		{ displayedProduct && <Flex
            style={ { border: "1px solid #cfd9e0", borderRadius: 6, width: "calc(100% - 1px)", padding: "16px 8px" } }>
            <img src={ API_URL + displayedProduct.image }
                 style={ { width: 50, height: 50, objectFit: "contain" } }/>
            
            <Flex flexDirection={ "column" } gap={ 0 } style={ { marginLeft: 10 } }>
                <Heading element={ "h4" }
                         style={ {
							 fontSize: "1.2em",
							 marginTop: -4,
							 marginBottom: 0
						 } }>
					{ displayedProduct.brand } | { displayedProduct.name }
                </Heading>
                <Paragraph style={ { fontSize: "0.9em", marginBottom: 0 } }>{ displayedProduct.code }</Paragraph>
            </Flex>
            
            <Button onClick={ () => {
				sdk.field.removeValue();
				setValue(undefined);
			} } style={ { marginLeft: "auto" } }>
                X
            </Button>
        </Flex> }
		
		{ displayedCategory && <Flex
            style={ { border: "1px solid #cfd9e0", borderRadius: 6, width: "calc(100% - 1px)", padding: "16px 8px", gap: "8px", alignItems: "flex-start" } }>
            <Flex flexDirection={ "column" } gap={ 0 } style={ { marginLeft: 10, flex: 1 } }>
                <Heading element={ "h4" }
                         style={ {
							 fontSize: "1.2em",
							 marginTop: -4,
							 marginBottom: 0
						 } }>
					{ displayedCategory.name }
                </Heading>
                <Paragraph style={ { fontSize: "0.9em", marginBottom: 0 } }>
					{ displayedCategory.productAmount } products in this category
				</Paragraph>
                
                <FormControl style={ { borderTop: "1px solid #cfd9e0", marginTop: "16px", paddingTop: "8px", marginBottom: 0 } }>
					<FormControl.Label>Page Size</FormControl.Label>
                    <TextInput type={ "number" }
                               value={ displayedCategory.pageSize }
                               min={ 1 } max={ 20 }
                               onChange={ (event: { target: { value: string } }) => {
								   if (!value) return;
								   
								   // update value.data with new pageSize param
								   let newPageSize = parseInt(event.target.value);
								   let newUrl = new URL(value.data);
								   newUrl.searchParams.set('pageSize', newPageSize.toString());
								   setValue({
									   type: value.type,
									   data: newUrl.toString()
								   });
							   } }/>
                    <FormControl.HelpText>Define how many products should be rendered</FormControl.HelpText>
				</FormControl>
            </Flex>
            
            <Button onClick={ () => {
				sdk.field.removeValue();
				setValue(undefined);
			} } style={ { marginInline: "8px" } }>
                X
            </Button>
        </Flex> }
		
		<Button onClick={ openDialog } style={ { marginTop: 10 } }>Open Dialog</Button>
	</>
};

export default Field;

// product :: https://api.cvy8qx-unicgmbha1-d1-public.model-t.cc.commerce.ondemand.com/occ/v2/powertools-spa/products/3788611
// category :: https://api.cvy8qx-unicgmbha1-d1-public.model-t.cc.commerce.ondemand.com/occ/v2/powertools-spa/catalogs/powertoolsProductCatalog/Online/Open-Catalogue/Components/Cables-For-Computers-And-Peripherals/c/830
