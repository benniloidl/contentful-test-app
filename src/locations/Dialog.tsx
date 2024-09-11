import React, { useEffect, useState } from 'react';
import {
	Button,
	Flex, FormControl, FormLabel,
	Grid, Option, Pagination,
	Paragraph, Radio, Select, SkeletonRow, Spinner, Stack,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow, Tabs, TextInput
} from '@contentful/f36-components';
import { DialogAppSDK } from '@contentful/app-sdk';
import { /* useCMA, */ useSDK } from '@contentful/react-apps-toolkit';

interface BaseSite {
	channel: string;
	uid: string;
	name: string;
}

interface ProductCategorySearch {
	products: any[];
	facets: any[];
	pagination: { currentPage: number, pageSize: number, totalResults: number, totalPages: number };
}

export default function Dialog() {
	const sdk = useSDK<DialogAppSDK>();
	
	const [baseSites, setBaseSites] = useState<BaseSite[]>([]);
	const [errorLoadingBaseSites, setErrorLoadingBaseSites] = useState<boolean>(false);
	const [selectedBaseSite, setSelectedBaseSite] = useState<BaseSite | null>(null);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [productCategorySearch, setProductCategorySearch] = useState<ProductCategorySearch | null>(null);
	const [errorLoadingProductCategorySearch, setErrorLoadingProductCategorySearch] = useState<boolean>(false);
	const [query, setQuery] = useState<string>("");
	const [page, setPage] = useState<number>(0);
	const [catalog, setCatalog] = useState<any>(undefined);
	
	useEffect(() => {
		let url = sdk.parameters.installation.apiUrl + "/occ/v2/basesites?fields=FULL";
		fetch(url)
			.then(response => response.json())
			.then(data => {
				if (data.baseSites) {
					let _baseSites = data.baseSites.filter((bs: any) => bs.requiresAuthentication !== true);
					setBaseSites(_baseSites);
					
					if (_baseSites.length > 0) setSelectedBaseSite(_baseSites[0] as BaseSite);
				} else setErrorLoadingBaseSites(true);
			})
			.catch(error => {
				console.error(error);
				setErrorLoadingBaseSites(true);
			});
	}, []);
	
	useEffect(() => {
		if (!selectedBaseSite) return;
		
		setIsLoading(true);
		setCatalog(undefined);
		
		let url = sdk.parameters.installation.apiUrl + "/occ/v2/" + selectedBaseSite.uid + "/products/search?query=" + encodeURIComponent(query) + "&fields=FULL&currentPage=" + page;
		fetch(url)
			.then(response => response.json())
			.then(data => {
				if (data) setProductCategorySearch(data);
				setErrorLoadingProductCategorySearch(true);
			})
			.catch(error => {
				console.error(error);
				setErrorLoadingProductCategorySearch(true);
			})
			.finally(() => setIsLoading(false));
		
		fetch(sdk.parameters.installation.apiUrl + "/occ/v2/" + selectedBaseSite.uid + "/catalogs")
			.then(response => response.json())
			.then(data => {
				if (data.catalogs[0]?.catalogVersions) {
					let catalog = data.catalogs[0].catalogVersions.find((catalogVersion: any) => catalogVersion.id === "Online");
					if (catalog) setCatalog(catalog);
				}
			})
			.catch(error => {
				console.error(error);
			});
	}, [baseSites, selectedBaseSite, query, page]);
	
	function renderCatalog(catalog: any, path: string = "") {
		let categories = catalog.categories;
		if (categories) path = catalog.url ?? "";
		if (catalog.subcategories) categories = catalog.subcategories;
		
		if (categories) return <Flex gap={ "spacingM" } flexDirection={ "column" }>
			{ categories.map((category: any, index: number) => {
				return <Flex gap={ "spacingM" } key={ index }>
					<Button variant={ "primary" }
							onClick={ () => sdk.close({
								type: "category",
								data: sdk.parameters.installation.apiUrl + "/occ/v2/" + (selectedBaseSite?.uid ?? "") + "/categories/" + category.id + "/products?pageSize=3"
							}) }>
						{ category.name }
					</Button>
					
					{ category.subcategories && renderCatalog(category, path) }
				</Flex>;
			}) }
		</Flex>
		
		return <Paragraph>No categories found</Paragraph>;
	}
	
	function getAllCategories(catalog: any, path: string = "") {
		let categories = catalog.categories;
		if (catalog.subcategories) categories = catalog.subcategories;
		
		if (!categories) return [];
		
		let allCategories = categories.map((category: any) => path + category.name);
		categories.forEach((category: any) => {
			if (category.subcategories) allCategories.push(...getAllCategories(category, path + category.name + " / "));
		});
		
		return allCategories;
	}
	
	return <>
		<Flex style={ { position: "absolute", top: 10, right: 20 } }>
			<Select style={ { height: 28, paddingBlock: 0 } }
					onChange={ (event: any) => setSelectedBaseSite(baseSites.find(baseSite => baseSite.name === event.target.value)!) }>
				{ baseSites.length === 0 ? <Option>Loading..</Option> : errorLoadingBaseSites ?
					<Option>Error!</Option> : baseSites.map((baseSite, index) =>
						<Option key={ index }>{ baseSite.name }</Option>
					) }
			</Select>
		</Flex>
		
		<Tabs defaultTab={ "products" }>
			<Tabs.List variant={ "horizontal-divider" }>
				<Tabs.Tab panelId={ "products" }>Products</Tabs.Tab>
				<Tabs.Tab panelId={ "categories" }>Categories</Tabs.Tab>
			</Tabs.List>
			
			<Tabs.Panel id={ "products" }>
				<Flex flexDirection={ "column" } gap={ "spacingS" } style={ { padding: '10px 20px' } }>
					<Flex flexDirection={ "row" }>
						<TextInput placeholder={ "Search" }
								   type={ "text" }
								   value={ query }
								   onChange={ (e: any) => { setQuery(e.target.value) } }/>
						
						{ productCategorySearch && productCategorySearch.pagination &&
                            <Pagination activePage={ productCategorySearch?.pagination.currentPage }
                                        onPageChange={ (page: number) => setPage(page) }
                                        itemsPerPage={ productCategorySearch?.pagination.pageSize }
                                        totalItems={ productCategorySearch?.pagination.totalResults }/> }
					</Flex>
					
					<Table>
						<TableHead>
							<TableRow>
								<TableCell style={ { width: 100 } }/>
								<TableCell>Product</TableCell>
								<TableCell/>
							</TableRow>
						</TableHead>
						
						<TableBody>
							{ isLoading ? <SkeletonRow columnCount={ 3 } rowCount={ 4 }/>
								: (productCategorySearch && productCategorySearch.products) ? productCategorySearch.products.map((product, index) =>
									<TableRow key={ index }>
										<TableCell style={ { paddingBlock: 0 } }>
											<Flex alignItems={ "center" } justifyContent={ "center" }>
												{ product.firstVariantImage ?
													<img src={ sdk.parameters.installation.apiUrl + product.firstVariantImage } alt={ product.name }
														 height={ 100 } width={ 100 }
														 style={ { objectFit: "contain" } }/> : null }
											</Flex>
										</TableCell>
										
										<TableCell>
											<Flex flexDirection={ "column" }>
												<Flex style={ { alignItems: "flex-end", marginBottom: "0.6em" } } gap={ "spacingS" }>
													<Paragraph style={ { fontWeight: "bold", fontSize: "1.2em", marginBottom: "2px" } }>
														{ product.manufacturer } | { product.name }
													</Paragraph>
													<Paragraph style={ { marginBottom: 0 } }>
														{ product.code }
													</Paragraph>
												</Flex>
												<Paragraph>
													{ product.summary?.substr(0, 100) }
													{ product.summary?.length > 100 && "..." }
												</Paragraph>
											</Flex>
										</TableCell>
										
										<TableCell style={ { height: "100%" } }>
											<Flex flexDirection={ "row" } alignItems={ "center" } justifyContent={ "space-between" } style={ { height: "100%" } }>
												<Paragraph style={ { fontSize: "1.2em", marginBottom: 0 } }>
													{ product.price.formattedValue }
												</Paragraph>
												<Button variant={ "primary" }
														onClick={ () => sdk.close({
															type: "product",
															data: sdk.parameters.installation.apiUrl + "/occ/v2/" + (selectedBaseSite?.uid ?? "") + "/products/" + product.code
														}) }>
													Select
												</Button>
											</Flex>
										</TableCell>
									</TableRow>
								) : errorLoadingProductCategorySearch ? <TableRow>
									<TableCell colSpan={ 3 }>
										<Paragraph>Error loading products</Paragraph>
									</TableCell>
								</TableRow> : null }
						</TableBody>
					</Table>
				</Flex>
			</Tabs.Panel>
			<Tabs.Panel id={ "categories" }>
				<Flex flexDirection={ "column" } gap={ "spacingS" } style={ { padding: '10px 20px' } }>
					{ catalog && renderCatalog(catalog) }
				</Flex>
			</Tabs.Panel>
		</Tabs>
	</>
};
